# C/C++ File Outline Generator

Generate structured outline files for C/C++ source code, providing a comprehensive view of all symbols, functions, classes, and variables in your codebase.

## Features

- **Automatic Symbol Collection**: Recursively scans C/C++ files (.c, .h, .cpp, .hpp, .cc, .cxx, etc.) and extracts all symbols.
- **Multiple Output Formats**: Generates outlines in JSON, Markdown, and plain text formats.
- **Hierarchical Structure**: Displays symbols organized by file with parent-child relationships for nested definitions.
- **Line Number Tracking**: Each symbol includes precise file location (line and column information).
- **Performance Optimized**: Handles large codebases (256+ files) with concurrent file processing.
- **Detailed Statistics**: Reports total files and symbol counts.

## Installation

1. Install from VS Code Marketplace by searching for "C/C++ File Outline Generator".
2. Or install from VSIX:
   ```bash
   vsce package
   # Then in VS Code: Install from VSIX...
   ```

## Usage

1. Open a folder containing C/C++ source files in VS Code.
2. Right-click on the folder in Explorer and select **"Generate C/C++ File Outline"**.
3. Or open Command Palette (`Ctrl+Shift+P`) and run **"Generate C/C++ File Outline"**.
4. Wait for the outline generation to complete.
5. Three files will be generated in the folder root:
   - `driver_outline.json` - Machine-readable format
   - `driver_outline.md` - Readable Markdown format
   - `driver_outline.txt` - Plain text format

## Requirements

- VS Code 1.89 or later
- **C/C++ Extension (ms-vscode.cpptools)** - Required for symbol extraction. This extension uses VS Code's C/C++ language server to parse and collect symbols from your source files.

## Known Issues

- Very large projects (1000+ files) may take several minutes to process.
- Symbol extraction depends on VS Code's language server; some advanced C++ syntax may not be fully recognized.

## Release Notes

### 0.0.1

Initial release with support for:
- C/C++ source file scanning
- Symbol collection and formatting
- Multi-format output (JSON, Markdown, text)
- Concurrent file processing for performance
- Progress indication during generation
