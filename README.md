A Node.js service to process CSV files, insert them into PostgreSQL, and return an age distribution summary. Supports **nested CSV headers**, **batch insertion**, and **human-readable console output**.

## Features

- Process large CSV files with nested properties.  
- Batch insert into PostgreSQL to optimise memory.  
- Console logs human-readable **Age-Group % Distribution**.  
- JSON response includes **total records** and **age distribution**.  
- Safe file upload handling with size limits and type validation.


---

## Prerequisites

- Node.js >= 20  
- npm  
- PostgreSQL >= 15  

---

## Setup & Installation

```bash
git clone https://github.com/iqlipse-abhi/Csv-to-Json
cd csv-to-json-prod
npm install
npm run dev
```

## Environment Var

```bash
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://postgres:password@localhost:5432/csv_import
CSV_INPUT_FOLDER=./uploads
BATCH_SIZE=500
MAX_FILE_SIZE_BYTES=10485760
```

## Database Setup

 - Start PostgreSQL locally.
 - Create the database:
 - CREATE DATABASE csv_import;

Run the table migration:
```bash
psql -U postgres -d csv_import -f migrations/create_table.sql
```

## Running the App
```bash
node src/server.js
OR
npm run dev
```

## API Usage

### Upload CSV file:

```bash
POST /upload/file
Form-data: File
Form Key: file
```


### Using curl:
```bash
curl -F "file=@sample.csv" http://localhost:3000/upload/file
```

## Sample Output

### Console:

Processing file: ./uploads/sample.csv
<img width="717" height="298" alt="image" src="https://github.com/user-attachments/assets/35fb6c38-c6c6-480b-80f9-8d5b87372d95" />



### JSON Response Postman:

<img width="1478" height="900" alt="image" src="https://github.com/user-attachments/assets/9e3138a0-16f7-4a75-8c94-76c948f07494" />




