import fs from 'fs/promises';
import path from 'path';

/**
 * Recursively searches a directory for .flac files using Depth-First-Search.
 * @param {string} dirPath - The starting directory path.
 * @returns {Promise<string[]>} - An array of absolute file paths.
 */

async function findFlacFiles(dirPath) {
  let flacFiles = [];
  
  try {
    // 1. Read the contents of the current directory.
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    // 2. Loop through every item found in the directory.
    for (const entry of entries) {
      // Construct the absolute path of this specific entry.
      const fullPath = path.join(dirPath, entry.name);

      // 3. BASE CASE: if it's a file AND ends with .flac, add it to the array.
      if (entry.isFile() && entry.name.endsWith('.flac')) {
        flacFiles.push(fullPath);
      } 
      // 4. RECURSIVE STEP: If it's a directory, dive into it.
      else if (entry.isDirectory()) {
        const nestedFiles = await findFlacFiles(fullPath);
        
        // Unpack the nested files and push them onto the current list.
        flacFiles.push(...nestedFiles);
      }
    }
  } catch (error) {
      console.error(`Error reading directory ${dirPath}: `, error.message);
  }
  return flacFiles;
}

export default findFlacFiles;

