from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
import re
import numpy as np
from numpy.linalg import norm
import logging
import time
from pathlib import Path
import pandas as pd
import asyncio
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
from queue import Queue
import uuid
from datetime import datetime, timedelta
import random
from collections import defaultdict
import zipfile
import tempfile
import shutil

# Document processing
from PyPDF2 import PdfReader
import docx
import google.generativeai as genai
from dotenv import load_dotenv
# For vectorization
from gensim.models.doc2vec import Doc2Vec

# Initialize FastAPI app
app = FastAPI(title="Resume Processing API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv()

# 5 API keys for parallel processing
API_KEYS = [
    os.getenv("GOOGLE_API_KEY_1"),
    os.getenv("GOOGLE_API_KEY_2"), 
    os.getenv("GOOGLE_API_KEY_3"),
    os.getenv("GOOGLE_API_KEY_4"),
    os.getenv("GOOGLE_API_KEY_5"),
]

# Filter out None values
API_KEYS = [key for key in API_KEYS if key is not None]
if not API_KEYS:
    API_KEYS = [os.getenv("GOOGLE_API_KEY")]

# Configuration
BATCH_SIZE = 5  # Fixed batch size
MAX_WORKERS = 5  # Use all 5 API keys
RETRY_ATTEMPTS = 3
RETRY_DELAY = 5
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB max file size
UPLOAD_DIR = Path("uploads")
TEMP_DIR = Path("temp")

# Create directories
RESULTS_DIR = Path("results")
RESULTS_DIR.mkdir(exist_ok=True)
UPLOAD_DIR.mkdir(exist_ok=True)
TEMP_DIR.mkdir(exist_ok=True)

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache the Doc2Vec model
DOC2VEC_MODEL = None

# Thread-safe API key distributor
class APIKeyDistributor:
    def __init__(self, api_keys):
        self.api_keys = api_keys
        self.key_queue = Queue()
        self.usage_stats = defaultdict(int)
        self.lock = threading.Lock()
        
        # Initialize queue
        for key in api_keys:
            self.key_queue.put(key)
    
    def get_api_key(self):
        """Get an API key (blocks until available)"""
        key = self.key_queue.get()
        with self.lock:
            self.usage_stats[key] += 1
        return key
    
    def return_api_key(self, key):
        """Return API key to queue"""
        self.key_queue.put(key)
    
    def get_stats(self):
        with self.lock:
            return dict(self.usage_stats)

# Initialize API key distributor
api_distributor = APIKeyDistributor(API_KEYS)

# Job tracking
job_status = {}

# Models
class ResumeParsingRequest(BaseModel):
    folder_path: str

class JobMatchingRequest(BaseModel):
    csv_file_path: str
    job_description: str

class JobStatus(BaseModel):
    job_id: str
    status: str
    total_files: int
    processed_files: int
    failed_files: int
    progress_percentage: float
    result_csv_path: Optional[str] = None
    error_message: Optional[str] = None
    processing_time: Optional[float] = None

# Helper functions
def load_doc2vec_model():
    """Load and cache the Doc2Vec model"""
    global DOC2VEC_MODEL
    if DOC2VEC_MODEL is None:
        logger.info("Loading Doc2Vec model...")
        try:
            DOC2VEC_MODEL = Doc2Vec.load("cv_job_maching.model")
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise HTTPException(status_code=500, detail="Failed to load matching model")
    return DOC2VEC_MODEL

def extract_zip_file(zip_file_path, extract_to_path):
    """Extract ZIP file and return list of resume files"""
    supported_extensions = {'.pdf', '.doc', '.docx', '.txt'}
    resume_files = []
    
    try:
        with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
            # Extract all files
            zip_ref.extractall(extract_to_path)
            
            # Find all resume files in extracted content
            extract_path = Path(extract_to_path)
            for file_path in extract_path.rglob('*'):
                if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
                    # Skip hidden files and __MACOSX folder (common in ZIP files)
                    if not any(part.startswith('.') or part.startswith('__MACOSX') for part in file_path.parts):
                        resume_files.append({
                            "path": str(file_path),
                            "filename": file_path.name
                        })
        
        logger.info(f"Extracted ZIP and found {len(resume_files)} resume files")
        return resume_files
        
    except zipfile.BadZipFile:
        raise ValueError("Invalid ZIP file")
    except Exception as e:
        raise ValueError(f"Error extracting ZIP file: {str(e)}")

def get_resume_files(folder_path):
    """Get all resume files from folder (kept for backward compatibility)"""
    supported_extensions = {'.pdf', '.doc', '.docx', '.txt'}
    resume_files = []
    
    folder = Path(folder_path)
    if not folder.exists():
        raise ValueError(f"Folder does not exist: {folder_path}")
    
    for file_path in folder.rglob('*'):
        if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
            resume_files.append({
                "path": str(file_path),
                "filename": file_path.name
            })
    
    logger.info(f"Found {len(resume_files)} resume files")
    return resume_files

def extract_text_from_file(file_path):
    """Extract text from different file types"""
    file_extension = os.path.splitext(file_path)[1].lower()
    
    try:
        if file_extension == ".txt":
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        elif file_extension == ".pdf":
            pdf = PdfReader(file_path)
            text = ""
            for page in pdf.pages:
                text += page.extract_text()
            return text
        elif file_extension in [".docx", ".doc"]:
            doc = docx.Document(file_path)
            text = ""
            for para in doc.paragraphs:
                text += para.text + "\n"
            return text
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")
    except Exception as e:
        raise ValueError(f"Error reading file {file_path}: {str(e)}")

def analyze_resume_with_gemini(resume_text, api_key, filename):
    """Analyze resume using Gemini API"""
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""
        Analyze this resume and extract information in JSON format:
        
        {resume_text}
        
        Return JSON with this structure:
        {{
            "summary": "comprehensive summary of candidate's background and qualifications",
            "email": "candidate's email address (if found, else empty string)",
            "phone": "candidate's phone number (if found, else empty string)",
            "linkedin": "candidate's LinkedIn URL (if found, else empty string)",
            "other_contacts": ["any other contact info, e.g., github, website, etc."],
            "education": [
                {{"degree": "", "institution": "", "year": ""}}
            ],
            "work_experience": [
                {{"title": "", "company": "", "duration": "", "responsibilities": []}}
            ],
            "technical_skills": [],
            "soft_skills": [],
            "key_skills": [],
            "experience_years": "X years"
        }}
        
        Return only valid JSON, no additional text.
        """
        
        response = model.generate_content(prompt)
        
        # Extract response text
        if hasattr(response, 'text'):
            response_text = response.text
        elif hasattr(response, 'candidates') and response.candidates:
            response_text = response.candidates[0].content.parts[0].text
        else:
            response_text = str(response)
        
        # Parse JSON
        json_match = re.search(r'({.*})', response_text.replace('\n', ' '), re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
        else:
            raise ValueError("No valid JSON found in response")
            
    except Exception as e:
        logger.error(f"Error analyzing {filename}: {str(e)}")
        raise

def process_single_resume(file_info, worker_id):
    """Process a single resume file"""
    filename = file_info["filename"]
    file_path = file_info["path"]
    api_key = None
    
    try:
        logger.info(f"Worker {worker_id} processing: {filename}")
        
        # Get API key
        api_key = api_distributor.get_api_key()
        
        # Extract text
        resume_text = extract_text_from_file(file_path)
        
        # Analyze with Gemini
        analysis = analyze_resume_with_gemini(resume_text, api_key, filename)
        
        result = {
            "filename": filename,
            "name": analysis.get("name", ""),
            "email": analysis.get("email", ""),
            "phone": analysis.get("phone", ""),
            "linkedin": analysis.get("linkedin", ""),
            "other_contacts": ", ".join(analysis.get("other_contacts", [])),
            "summary": analysis.get("summary", ""),
            "key_skills": ", ".join(analysis.get("key_skills", [])),
            "technical_skills": ", ".join(analysis.get("technical_skills", [])),
            "soft_skills": ", ".join(analysis.get("soft_skills", [])),
            "experience_years": analysis.get("experience_years", ""),
            "education": json.dumps(analysis.get("education", [])),
            "work_experience": json.dumps(analysis.get("work_experience", [])),
            "status": "success",
            "error": ""
        }
        
        logger.info(f"✅ Worker {worker_id} completed: {filename}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Worker {worker_id} failed {filename}: {str(e)}")
        return {
            "filename": filename,
            "name": "Error",
            "email": "Error", 
            "phone": "",
            "linkedin": "",
            "other_contacts": "",
            "summary": "",
            "key_skills": "",
            "technical_skills": "",
            "soft_skills": "",
            "experience_years": "",
            "education": "",
            "work_experience": "",
            "status": "failed",
            "error": str(e)
        }
    finally:
        if api_key:
            api_distributor.return_api_key(api_key)

def split_files_for_workers(files, num_workers):
    """Split files evenly among workers"""
    splits = [[] for _ in range(num_workers)]
    for i, file_info in enumerate(files):
        worker_id = i % num_workers
        splits[worker_id].append(file_info)
    
    logger.info(f"Split {len(files)} files among {num_workers} workers:")
    for i, split in enumerate(splits):
        logger.info(f"  Worker {i}: {len(split)} files")
    
    return splits

def process_worker_files(worker_files, worker_id, job_id):
    """Process all files assigned to a worker"""
    worker_results = []
    
    for file_info in worker_files:
        result = process_single_resume(file_info, worker_id)
        worker_results.append(result)
        
        # Update job status
        if job_id in job_status:
            with threading.Lock():
                job_status[job_id]["processed_files"] += 1
                if result["status"] == "failed":
                    job_status[job_id]["failed_files"] += 1
                
                total = job_status[job_id]["total_files"]
                processed = job_status[job_id]["processed_files"]
                job_status[job_id]["progress_percentage"] = round((processed / total) * 100, 2)
    
    return worker_results

def clean_text(text):
    """Clean text for matching"""
    text = text.lower()
    text = re.sub(r'[^a-z\s]', '', text)
    return ' '.join(text.split())

def calculate_match_score(summary, job_description):
    """Calculate job match score"""
    try:
        model = load_doc2vec_model()
        
        # Clean texts
        summary_clean = clean_text(summary)
        job_clean = clean_text(job_description)
        
        # Vectorize
        v1 = model.infer_vector(summary_clean.split())
        v2 = model.infer_vector(job_clean.split())
        
        # Calculate similarity
        similarity = 100 * (np.dot(v1, v2) / (norm(v1) * norm(v2)))
        return round(similarity, 2)
    except Exception as e:
        logger.error(f"Match calculation error: {e}")
        return 0.0

def get_recommendation(score):
    """Get recommendation based on score"""
    if score < 50:
        return "Low match - modify CV"
    elif score < 70:
        return "Good match - can improve"
    else:
        return "Excellent match - submit CV"

def cleanup_temp_folder(temp_path):
    """Clean up temporary folder after processing"""
    try:
        if os.path.exists(temp_path):
            shutil.rmtree(temp_path)
            logger.info(f"Cleaned up temporary folder: {temp_path}")
    except Exception as e:
        logger.warning(f"Failed to cleanup temp folder {temp_path}: {e}")

async def process_resume_parsing_from_zip(zip_file_path, job_id):
    """Main resume parsing function from ZIP file with parallel processing"""
    start_time = time.time()
    temp_extract_path = None
    
    try:
        job_status[job_id]["status"] = "processing"
        
        # Create temporary extraction directory
        temp_extract_path = TEMP_DIR / f"extract_{job_id}"
        temp_extract_path.mkdir(exist_ok=True)
        
        # Extract ZIP file and get resume files
        files = extract_zip_file(zip_file_path, temp_extract_path)
        job_status[job_id]["total_files"] = len(files)
        
        if not files:
            raise ValueError("No valid resume files found in ZIP archive")
        
        # Split files among workers
        file_splits = split_files_for_workers(files, MAX_WORKERS)
        
        # Process files in parallel using ThreadPoolExecutor
        all_results = []
        
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # Submit worker tasks
            futures = [
                executor.submit(process_worker_files, worker_files, worker_id, job_id)
                for worker_id, worker_files in enumerate(file_splits)
                if worker_files  # Only submit if worker has files
            ]
            
            # Collect results from all workers
            for future in as_completed(futures):
                try:
                    worker_results = future.result(timeout=1800)  # 30 minute timeout
                    all_results.extend(worker_results)
                except Exception as e:
                    logger.error(f"Worker failed: {e}")
        
        # Save results to CSV
        df = pd.DataFrame(all_results)
        csv_path = RESULTS_DIR / f"resume_parsing_{job_id}.csv"
        df.to_csv(csv_path, index=False)
        
        processing_time = time.time() - start_time
        
        # Update job status
        job_status[job_id].update({
            "status": "completed",
            "result_csv_path": str(csv_path),
            "processing_time": round(processing_time, 2)
        })
        
        # Log statistics
        successful = len([r for r in all_results if r["status"] == "success"])
        failed = len([r for r in all_results if r["status"] == "failed"])
        api_stats = api_distributor.get_stats()
        
        logger.info(f"Resume parsing completed in {processing_time:.2f}s")
        logger.info(f"Results: {successful} successful, {failed} failed")
        logger.info(f"API usage: {api_stats}")
        
    except Exception as e:
        logger.error(f"Resume parsing failed: {e}")
        job_status[job_id].update({
            "status": "failed",
            "error_message": str(e),
            "processing_time": round(time.time() - start_time, 2)
        })
    finally:
        # Clean up temporary files
        if temp_extract_path:
            cleanup_temp_folder(temp_extract_path)
        if os.path.exists(zip_file_path):
            os.remove(zip_file_path)

async def process_resume_parsing(folder_path, job_id):
    """Main resume parsing function with parallel processing (kept for backward compatibility)"""
    start_time = time.time()
    
    try:
        job_status[job_id]["status"] = "processing"
        
        # Get all resume files
        files = get_resume_files(folder_path)
        job_status[job_id]["total_files"] = len(files)
        
        # Split files among workers
        file_splits = split_files_for_workers(files, MAX_WORKERS)
        
        # Process files in parallel using ThreadPoolExecutor
        all_results = []
        
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # Submit worker tasks
            futures = [
                executor.submit(process_worker_files, worker_files, worker_id, job_id)
                for worker_id, worker_files in enumerate(file_splits)
                if worker_files  # Only submit if worker has files
            ]
            
            # Collect results from all workers
            for future in as_completed(futures):
                try:
                    worker_results = future.result(timeout=1800)  # 30 minute timeout
                    all_results.extend(worker_results)
                except Exception as e:
                    logger.error(f"Worker failed: {e}")
        
        # Save results to CSV
        df = pd.DataFrame(all_results)
        csv_path = RESULTS_DIR / f"resume_parsing_{job_id}.csv"
        df.to_csv(csv_path, index=False)
        
        processing_time = time.time() - start_time
        
        # Update job status
        job_status[job_id].update({
            "status": "completed",
            "result_csv_path": str(csv_path),
            "processing_time": round(processing_time, 2)
        })
        
        # Log statistics
        successful = len([r for r in all_results if r["status"] == "success"])
        failed = len([r for r in all_results if r["status"] == "failed"])
        api_stats = api_distributor.get_stats()
        
        logger.info(f"Resume parsing completed in {processing_time:.2f}s")
        logger.info(f"Results: {successful} successful, {failed} failed")
        logger.info(f"API usage: {api_stats}")
        
    except Exception as e:
        logger.error(f"Resume parsing failed: {e}")
        job_status[job_id].update({
            "status": "failed",
            "error_message": str(e),
            "processing_time": round(time.time() - start_time, 2)
        })

async def process_job_matching(csv_file_path, job_description, job_id):
    """Process job matching for CSV file"""
    start_time = time.time()
    
    try:
        job_status[job_id]["status"] = "processing"
        
        # Read CSV
        df = pd.read_csv(csv_file_path)
        total_resumes = len(df)
        job_status[job_id]["total_files"] = total_resumes
        
        logger.info(f"Processing job matching for {total_resumes} resumes")
        
        # Add match columns
        df["match_score"] = 0.0
        df["recommendation"] = ""
        
        processed_count = 0
        results_json = []
        
        # Process each resume
        for idx, row in df.iterrows():
            try:
                if pd.notna(row["summary"]) and str(row["summary"]).strip():
                    score = calculate_match_score(row["summary"], job_description)
                    recommendation = get_recommendation(score)
                    df.at[idx, "match_score"] = score
                    df.at[idx, "recommendation"] = recommendation
                else:
                    df.at[idx, "match_score"] = 0.0
                    df.at[idx, "recommendation"] = "No summary available"
                
                processed_count += 1
                # Update progress
                progress = (processed_count / total_resumes) * 100
                job_status[job_id]["processed_files"] = processed_count
                job_status[job_id]["progress_percentage"] = round(progress, 2)
            except Exception as e:
                logger.error(f"Error processing row {idx}: {e}")
                df.at[idx, "match_score"] = 0.0
                df.at[idx, "recommendation"] = f"Error: {str(e)}"
        
        # Clean DataFrame for JSON serialization
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.fillna(0.0)
        
        # Build results_json
        for idx, row in df.iterrows():
            row_dict = row.to_dict()
            row_dict["match_score"] = df.at[idx, "match_score"]
            row_dict["recommendation"] = df.at[idx, "recommendation"]
            results_json.append(row_dict)
        
        # Save results
        result_csv_path = RESULTS_DIR / f"job_matching_{job_id}.csv"
        df.to_csv(result_csv_path, index=False)
        
        processing_time = time.time() - start_time
        
        # Update job status
        job_status[job_id].update({
            "status": "completed",
            "result_csv_path": str(result_csv_path),
            "processing_time": round(processing_time, 2),
            "results_json": results_json
        })
        
        logger.info(f"Job matching completed in {processing_time:.2f}s")
        
    except Exception as e:
        logger.error(f"Job matching failed: {e}")
        job_status[job_id].update({
            "status": "failed",
            "error_message": str(e),
            "processing_time": round(time.time() - start_time, 2),
            "results_json": []
        })

# API ENDPOINTS

@app.post("/api/parse-resumes-zip")
async def parse_resumes_from_zip(
    background_tasks: BackgroundTasks,
    zip_file: UploadFile = File(...)
):
    """
    Parse all resumes from an uploaded ZIP file
    - Accepts ZIP file upload containing resume files
    - Extracts ZIP to temporary directory
    - Uses 5 workers with 5 API keys in parallel
    - Saves results to CSV
    - Cleans up temporary files after processing
    """
    job_id = str(uuid.uuid4())
    
    try:
        # Validate file type
        if not zip_file.filename.lower().endswith('.zip'):
            raise HTTPException(status_code=400, detail="Only ZIP files are allowed")
        
        # Check file size
        if zip_file.size and zip_file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"File too large. Maximum size: {MAX_FILE_SIZE/1024/1024}MB")
        
        # Save uploaded ZIP file
        zip_filename = f"upload_{job_id}_{zip_file.filename}"
        zip_file_path = UPLOAD_DIR / zip_filename
        
        with open(zip_file_path, "wb") as buffer:
            content = await zip_file.read()
            buffer.write(content)
        
        logger.info(f"Uploaded ZIP file: {zip_filename} ({len(content)} bytes)")
        
        # Initialize job status
        job_status[job_id] = {
            "job_id": job_id,
            "status": "pending",
            "total_files": 0,
            "processed_files": 0,
            "failed_files": 0,
            "progress_percentage": 0.0,
            "result_csv_path": None,
            "error_message": None,
            "processing_time": None
        }
        
        # Start background processing
        background_tasks.add_task(process_resume_parsing_from_zip, str(zip_file_path), job_id)
        
        return {
            "job_id": job_id,
            "message": "Resume parsing from ZIP started",
            "filename": zip_file.filename,
            "file_size": len(content)
        }
        
    except Exception as e:
        logger.error(f"Parse resumes from ZIP error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/parse-resumes")
async def parse_resumes(
    background_tasks: BackgroundTasks,
    request: ResumeParsingRequest
):
    """
    Parse all resumes from a folder (kept for backward compatibility)
    - Uses 5 workers with 5 API keys in parallel
    - Splits files evenly among workers
    - Saves results to CSV
    """
    job_id = str(uuid.uuid4())
    
    try:
        # Validate folder
        if not os.path.exists(request.folder_path):
            raise HTTPException(status_code=404, detail="Folder not found")
        
        # Initialize job status
        job_status[job_id] = {
            "job_id": job_id,
            "status": "pending",
            "total_files": 0,
            "processed_files": 0,
            "failed_files": 0,
            "progress_percentage": 0.0,
            "result_csv_path": None,
            "error_message": None,
            "processing_time": None
        }
        
        # Start background processing
        background_tasks.add_task(process_resume_parsing, request.folder_path, job_id)
        
        return {
            "job_id": job_id,
            "message": "Resume parsing started",
            "folder_path": request.folder_path
        }
        
    except Exception as e:
        logger.error(f"Parse resumes error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/match-jobs")
async def match_jobs(
    background_tasks: BackgroundTasks,
    request: JobMatchingRequest
):
    """
    Add job match scores to existing CSV
    - Reads CSV with parsed resumes
    - Calculates match score for each resume
    - Saves updated CSV with scores
    - Returns JSON content of results for frontend integration
    """
    job_id = str(uuid.uuid4())
    
    try:
        # Validate CSV file
        if not os.path.exists(request.csv_file_path):
            raise HTTPException(status_code=404, detail="CSV file not found")
        
        # Initialize job status
        job_status[job_id] = {
            "job_id": job_id,
            "status": "pending",
            "total_files": 0,
            "processed_files": 0,
            "failed_files": 0,
            "progress_percentage": 0.0,
            "result_csv_path": None,
            "error_message": None,
            "processing_time": None,
            "results_json": []
        }
        
        # Start background processing
        await process_job_matching(request.csv_file_path, request.job_description, job_id)
        # Return the JSON content directly
        return {
            "job_id": job_id,
            "message": "Job matching completed",
            "csv_file_path": job_status[job_id]["result_csv_path"],
            "results": job_status[job_id]["results_json"]
        }
        
    except Exception as e:
        logger.error(f"Match jobs error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/status/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """Get status of any job (parsing or matching)"""
    if job_id not in job_status:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job_status[job_id]

@app.get("/api/download/{job_id}")
async def download_results(job_id: str):
    """Download results CSV file"""
    if job_id not in job_status:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_info = job_status[job_id]
    
    if job_info["status"] != "completed" or not job_info["result_csv_path"]:
        raise HTTPException(status_code=400, detail="Results not ready")
    
    csv_path = job_info["result_csv_path"]
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Results file not found")
    return FileResponse(
        csv_path,
        media_type='text/csv',
        filename=f"results_{job_id}.csv"
    )

@app.get("/api/stats")
async def get_stats():
    """Get system statistics"""
    api_stats = api_distributor.get_stats()
    
    parsing_jobs = [j for j in job_status.values() if "total_files" in j]
    
    return {
        "api_keys_available": len(API_KEYS),
        "api_usage_stats": api_stats,
        "jobs": {
            "active": len([j for j in job_status.values() if j["status"] == "processing"]),
            "completed": len([j for j in job_status.values() if j["status"] == "completed"]),
            "failed": len([j for j in job_status.values() if j["status"] == "failed"]),
            "total": len(job_status)
        },
        "model_loaded": DOC2VEC_MODEL is not None
    }

@app.delete("/api/cleanup/{job_id}")
async def cleanup_job_files(job_id: str):
    """Clean up job-related files"""
    if job_id not in job_status:
        raise HTTPException(status_code=404, detail="Job not found")
    
    try:
        job_info = job_status[job_id]
        files_deleted = []
        
        # Delete result CSV if exists
        if job_info.get("result_csv_path") and os.path.exists(job_info["result_csv_path"]):
            os.remove(job_info["result_csv_path"])
            files_deleted.append(job_info["result_csv_path"])
        
        # Delete from job status
        del job_status[job_id]
        
        return {
            "message": f"Cleaned up job {job_id}",
            "files_deleted": files_deleted
        }
        
    except Exception as e:
        logger.error(f"Cleanup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "api_keys_available": len(API_KEYS),
        "workers": MAX_WORKERS,
        "batch_size": BATCH_SIZE,
        "max_file_size_mb": MAX_FILE_SIZE / 1024 / 1024
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)