const asyncHandler = require('express-async-handler');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const extract = require('extract-zip');
const mongoose = require('mongoose');

const execPromise = promisify(exec);

// Get all model names for data export
const getAllModelNames = () => {
  return Object.keys(mongoose.models);
};

// @desc    Create database backup
// @route   POST /api/admin/backup/database
// @access  Admin
const createDatabaseBackup = asyncHandler(async (req, res) => {
  const backupDir = path.join(__dirname, '../backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `backup-${timestamp}`;
  const backupPath = path.join(backupDir, backupName);

  try {
    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });

    // Get MongoDB connection URI
    const mongoUri = process.env.MONGODB_URI;
    
    // Execute mongodump command
    const command = `mongodump --uri="${mongoUri}" --out="${backupPath}"`;
    await execPromise(command);

    // Create a ZIP archive of the backup
    const zipPath = `${backupPath}.zip`;
    const output = require('fs').createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(backupPath, false);
      archive.finalize();
    });

    // Remove the uncompressed backup directory
    await fs.rm(backupPath, { recursive: true, force: true });

    res.status(200).json({
      success: true,
      message: 'Database backup created successfully',
      data: {
        filename: `${backupName}.zip`,
        path: `/api/admin/backup/download/${backupName}.zip`,
        size: (await fs.stat(zipPath)).size,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create database backup',
      error: error.message
    });
  }
});

// @desc    Export all data (GDPR compliance)
// @route   POST /api/admin/backup/export
// @access  Admin
const exportAllData = asyncHandler(async (req, res) => {
  const exportDir = path.join(__dirname, '../exports');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportName = `export-${timestamp}`;
  const exportPath = path.join(exportDir, exportName);

  try {
    // Ensure export directory exists
    await fs.mkdir(exportPath, { recursive: true });

    // Get all models
    const modelNames = getAllModelNames();
    const exportData = {};

    // Export data from each model
    for (const modelName of modelNames) {
      const Model = mongoose.model(modelName);
      const data = await Model.find({}).lean();
      exportData[modelName] = data;
      
      // Save individual collection as JSON
      await fs.writeFile(
        path.join(exportPath, `${modelName}.json`),
        JSON.stringify(data, null, 2)
      );
    }

    // Save combined export as JSON
    await fs.writeFile(
      path.join(exportPath, 'complete-export.json'),
      JSON.stringify(exportData, null, 2)
    );

    // Create metadata file
    const metadata = {
      exportDate: new Date().toISOString(),
      modelCount: modelNames.length,
      models: modelNames,
      totalRecords: Object.values(exportData).reduce((sum, arr) => sum + arr.length, 0)
    };
    await fs.writeFile(
      path.join(exportPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    // Create a ZIP archive
    const zipPath = `${exportPath}.zip`;
    const output = require('fs').createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(exportPath, false);
      archive.finalize();
    });

    // Remove the uncompressed export directory
    await fs.rm(exportPath, { recursive: true, force: true });

    res.status(200).json({
      success: true,
      message: 'Data export completed successfully',
      data: {
        filename: `${exportName}.zip`,
        path: `/api/admin/backup/download-export/${exportName}.zip`,
        size: (await fs.stat(zipPath)).size,
        timestamp: new Date(),
        metadata
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: error.message
    });
  }
});

// @desc    Restore database from backup
// @route   POST /api/admin/backup/restore
// @access  Admin
const restoreDatabase = asyncHandler(async (req, res) => {
  const { filename } = req.body;

  if (!filename) {
    res.status(400);
    throw new Error('Backup filename is required');
  }

  const backupDir = path.join(__dirname, '../backups');
  const backupPath = path.join(backupDir, filename);
  const extractPath = path.join(backupDir, `extract-${Date.now()}`);

  try {
    // Verify backup file exists
    await fs.access(backupPath);

    // Extract the backup
    await extract(backupPath, { dir: extractPath });

    // Find the database directory in the extracted files
    const files = await fs.readdir(extractPath);
    const dbDir = path.join(extractPath, files[0] || '');

    // Get MongoDB connection URI
    const mongoUri = process.env.MONGODB_URI;

    // Execute mongorestore command
    const command = `mongorestore --uri="${mongoUri}" --drop "${dbDir}"`;
    await execPromise(command);

    // Clean up extracted files
    await fs.rm(extractPath, { recursive: true, force: true });

    res.status(200).json({
      success: true,
      message: 'Database restored successfully',
      data: {
        filename,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Restore error:', error);
    
    // Clean up on error
    try {
      await fs.rm(extractPath, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to restore database',
      error: error.message
    });
  }
});

// @desc    Import data from export
// @route   POST /api/admin/backup/import
// @access  Admin
const importData = asyncHandler(async (req, res) => {
  const { filename, mode = 'merge' } = req.body;

  if (!filename) {
    res.status(400);
    throw new Error('Export filename is required');
  }

  const exportDir = path.join(__dirname, '../exports');
  const exportPath = path.join(exportDir, filename);
  const extractPath = path.join(exportDir, `extract-${Date.now()}`);

  try {
    // Verify export file exists
    await fs.access(exportPath);

    // Extract the export
    await extract(exportPath, { dir: extractPath });

    // Read metadata
    const metadataPath = path.join(extractPath, 'metadata.json');
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

    const importResults = {};

    // Import data for each model
    for (const modelName of metadata.models) {
      try {
        const Model = mongoose.model(modelName);
        const dataPath = path.join(extractPath, `${modelName}.json`);
        const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'));

        if (mode === 'replace') {
          // Delete all existing records
          await Model.deleteMany({});
        }

        // Insert new records
        if (data.length > 0) {
          await Model.insertMany(data, { ordered: false });
        }

        importResults[modelName] = {
          success: true,
          count: data.length
        };
      } catch (modelError) {
        importResults[modelName] = {
          success: false,
          error: modelError.message
        };
      }
    }

    // Clean up extracted files
    await fs.rm(extractPath, { recursive: true, force: true });

    const successCount = Object.values(importResults).filter(r => r.success).length;
    const failureCount = Object.values(importResults).filter(r => !r.success).length;

    res.status(200).json({
      success: true,
      message: `Data import completed: ${successCount} collections successful, ${failureCount} failed`,
      data: {
        filename,
        mode,
        timestamp: new Date(),
        results: importResults
      }
    });
  } catch (error) {
    console.error('Import error:', error);
    
    // Clean up on error
    try {
      await fs.rm(extractPath, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to import data',
      error: error.message
    });
  }
});

// @desc    List available backups
// @route   GET /api/admin/backup/list
// @access  Admin
const listBackups = asyncHandler(async (req, res) => {
  const backupDir = path.join(__dirname, '../backups');
  const exportDir = path.join(__dirname, '../exports');

  try {
    // Ensure directories exist
    await fs.mkdir(backupDir, { recursive: true });
    await fs.mkdir(exportDir, { recursive: true });

    // List backup files
    const backupFiles = await fs.readdir(backupDir);
    const backups = await Promise.all(
      backupFiles
        .filter(file => file.endsWith('.zip'))
        .map(async (file) => {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);
          return {
            filename: file,
            type: 'backup',
            size: stats.size,
            created: stats.birthtime,
            path: `/api/admin/backup/download/${file}`
          };
        })
    );

    // List export files
    const exportFiles = await fs.readdir(exportDir);
    const exports = await Promise.all(
      exportFiles
        .filter(file => file.endsWith('.zip'))
        .map(async (file) => {
          const filePath = path.join(exportDir, file);
          const stats = await fs.stat(filePath);
          return {
            filename: file,
            type: 'export',
            size: stats.size,
            created: stats.birthtime,
            path: `/api/admin/backup/download-export/${file}`
          };
        })
    );

    res.status(200).json({
      success: true,
      data: {
        backups: backups.sort((a, b) => b.created - a.created),
        exports: exports.sort((a, b) => b.created - a.created)
      }
    });
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
});

// @desc    Download backup file
// @route   GET /api/admin/backup/download/:filename
// @access  Admin
const downloadBackup = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const backupDir = path.join(__dirname, '../backups');
  const filePath = path.join(backupDir, filename);

  try {
    // Verify file exists
    await fs.access(filePath);

    res.download(filePath, filename);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Backup file not found'
    });
  }
});

// @desc    Download export file
// @route   GET /api/admin/backup/download-export/:filename
// @access  Admin
const downloadExport = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const exportDir = path.join(__dirname, '../exports');
  const filePath = path.join(exportDir, filename);

  try {
    // Verify file exists
    await fs.access(filePath);

    res.download(filePath, filename);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Export file not found'
    });
  }
});

// @desc    Delete backup or export file
// @route   DELETE /api/admin/backup/:type/:filename
// @access  Admin
const deleteBackupFile = asyncHandler(async (req, res) => {
  const { type, filename } = req.params;
  
  if (type !== 'backup' && type !== 'export') {
    res.status(400);
    throw new Error('Invalid type. Must be "backup" or "export"');
  }

  const baseDir = type === 'backup' 
    ? path.join(__dirname, '../backups')
    : path.join(__dirname, '../exports');
  const filePath = path.join(baseDir, filename);

  try {
    // Verify file exists
    await fs.access(filePath);

    // Delete the file
    await fs.unlink(filePath);

    res.status(200).json({
      success: true,
      message: `${type} file deleted successfully`,
      data: { filename }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: `${type} file not found`
    });
  }
});

module.exports = {
  createDatabaseBackup,
  exportAllData,
  restoreDatabase,
  importData,
  listBackups,
  downloadBackup,
  downloadExport,
  deleteBackupFile
};
