import React, { useState } from "react";
import { useCSVReader } from "react-papaparse";

function CSV() {
  const [jsonData, setJsonData] = useState(null);
  const { CSVReader } = useCSVReader();

  return (
    <div>
      <h2>CSV to JSON Converter</h2>

      <CSVReader
        onUploadAccepted={(results) => {
          // results.data contains the parsed CSV data
          const headers = results.data[0];
          const rows = results.data.slice(1);

          const jsonResult = rows.map((row) => {
            return headers.reduce((obj, header, index) => {
              obj[header] = row[index] || null;
              return obj;
            }, {});
          });

          setJsonData(jsonResult);
          console.log(jsonResult);
        }}
      >
        {({ getRootProps, acceptedFile }) => (
          <div
            {...getRootProps()}
            style={{ border: "2px dashed #ccc", padding: "20px" }}
          >
            {acceptedFile ? (
              <p>{acceptedFile.name}</p>
            ) : (
              <p>Drop CSV file here or click to upload</p>
            )}
          </div>
        )}
      </CSVReader>

      {jsonData && (
        <div>
          <h3>JSON Output:</h3>
          <pre>{JSON.stringify(jsonData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default CSV;
