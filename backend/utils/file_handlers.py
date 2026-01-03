"""
File Handler Module
Handles CSV, Excel, and SPSS file imports
"""
import os
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, Tuple
from werkzeug.utils import secure_filename


class FileHandler:
    """
    Handles data file imports from various formats
    """
    
    ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls', 'sav'}
    
    def __init__(self, upload_folder: str):
        self.upload_folder = upload_folder
        os.makedirs(upload_folder, exist_ok=True)
    
    def allowed_file(self, filename: str) -> bool:
        """Check if file extension is allowed"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in self.ALLOWED_EXTENSIONS
    
    def get_file_extension(self, filename: str) -> str:
        """Get file extension"""
        return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    def save_file(self, file) -> Tuple[str, str]:
        """
        Save uploaded file and return path and filename
        """
        filename = secure_filename(file.filename)
        filepath = os.path.join(self.upload_folder, filename)
        file.save(filepath)
        return filepath, filename
    
    def import_file(self, filepath: str) -> Dict[str, Any]:
        """
        Import data file and return DataFrame with metadata
        """
        extension = self.get_file_extension(filepath)
        
        try:
            if extension == 'csv':
                df = self._import_csv(filepath)
            elif extension in ['xlsx', 'xls']:
                df = self._import_excel(filepath)
            elif extension == 'sav':
                df = self._import_spss(filepath)
            else:
                return {'error': f'Unsupported file format: {extension}'}
            
            # Generate metadata
            metadata = self._generate_metadata(df)
            
            return {
                'success': True,
                'data': df,
                'metadata': metadata,
                'file_type': extension
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def _import_csv(self, filepath: str) -> pd.DataFrame:
        """Import CSV file with encoding detection"""
        # Try different encodings
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                df = pd.read_csv(filepath, encoding=encoding)
                return df
            except UnicodeDecodeError:
                continue
        
        # If all fail, try with error handling
        return pd.read_csv(filepath, encoding='utf-8', errors='replace')
    
    def _import_excel(self, filepath: str) -> pd.DataFrame:
        """Import Excel file"""
        # Try to get all sheets and use the first one with data
        try:
            xlsx = pd.ExcelFile(filepath)
            
            # If single sheet, use it
            if len(xlsx.sheet_names) == 1:
                return pd.read_excel(filepath)
            
            # Otherwise, find the largest sheet
            max_rows = 0
            best_sheet = None
            
            for sheet in xlsx.sheet_names:
                df = pd.read_excel(filepath, sheet_name=sheet)
                if len(df) > max_rows:
                    max_rows = len(df)
                    best_sheet = sheet
            
            return pd.read_excel(filepath, sheet_name=best_sheet)
            
        except Exception:
            return pd.read_excel(filepath)
    
    def _import_spss(self, filepath: str) -> pd.DataFrame:
        """Import SPSS .sav file"""
        try:
            import pyreadstat
            df, meta = pyreadstat.read_sav(filepath)
            return df
        except ImportError:
            raise ImportError("pyreadstat is required for SPSS files. Install with: pip install pyreadstat")
    
    def _generate_metadata(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate metadata for the imported dataset"""
        metadata = {
            'rows': len(df),
            'columns': len(df.columns),
            'column_names': df.columns.tolist(),
            'memory_usage_mb': round(df.memory_usage(deep=True).sum() / 1024 / 1024, 2),
            'column_types': {}
        }
        
        for col in df.columns:
            dtype = str(df[col].dtype)
            unique_count = df[col].nunique()
            missing_count = df[col].isna().sum()
            
            metadata['column_types'][col] = {
                'dtype': dtype,
                'unique_values': unique_count,
                'missing_count': int(missing_count),
                'missing_pct': round(missing_count / len(df) * 100, 2) if len(df) > 0 else 0
            }
        
        return metadata
    
    def get_preview(self, df: pd.DataFrame, n_rows: int = 10) -> Dict[str, Any]:
        """Get preview of data"""
        preview_df = df.head(n_rows)
        
        # Convert to JSON-safe format
        preview_data = []
        for _, row in preview_df.iterrows():
            row_data = {}
            for col in preview_df.columns:
                val = row[col]
                if pd.isna(val):
                    row_data[col] = None
                elif isinstance(val, (np.integer, np.floating)):
                    row_data[col] = float(val)
                else:
                    row_data[col] = str(val)
            preview_data.append(row_data)
        
        return {
            'columns': df.columns.tolist(),
            'preview': preview_data,
            'total_rows': len(df),
            'showing_rows': len(preview_data)
        }
    
    def export_to_csv(self, df: pd.DataFrame, filename: str) -> str:
        """Export DataFrame to CSV"""
        filepath = os.path.join(self.upload_folder, f'{filename}.csv')
        df.to_csv(filepath, index=False)
        return filepath
    
    def export_to_excel(self, df: pd.DataFrame, filename: str) -> str:
        """Export DataFrame to Excel"""
        filepath = os.path.join(self.upload_folder, f'{filename}.xlsx')
        df.to_excel(filepath, index=False)
        return filepath


class DataStorage:
    """
    In-memory storage for datasets during analysis session
    """
    
    def __init__(self):
        self.datasets: Dict[str, Dict[str, Any]] = {}
        self.counter = 0
    
    def store(self, df: pd.DataFrame, name: str = None, version: str = 'v1_raw') -> str:
        """Store a dataset and return its ID"""
        self.counter += 1
        dataset_id = f'dataset_{self.counter}'
        
        self.datasets[dataset_id] = {
            'data': df,
            'name': name or f'Dataset {self.counter}',
            'version': version,
            'versions': {version: df.copy()},
            'created_at': pd.Timestamp.now().isoformat()
        }
        
        return dataset_id
    
    def get(self, dataset_id: str) -> Optional[pd.DataFrame]:
        """Retrieve a dataset"""
        if dataset_id in self.datasets:
            return self.datasets[dataset_id]['data']
        return None
    
    def update(self, dataset_id: str, df: pd.DataFrame, version: str = None) -> bool:
        """Update a dataset"""
        if dataset_id not in self.datasets:
            return False
        
        self.datasets[dataset_id]['data'] = df
        
        if version:
            self.datasets[dataset_id]['version'] = version
            self.datasets[dataset_id]['versions'][version] = df.copy()
        
        return True
    
    def get_version(self, dataset_id: str, version: str) -> Optional[pd.DataFrame]:
        """Get a specific version of a dataset"""
        if dataset_id in self.datasets:
            versions = self.datasets[dataset_id].get('versions', {})
            return versions.get(version)
        return None
    
    def list_datasets(self) -> list:
        """List all stored datasets"""
        return [{
            'id': did,
            'name': info['name'],
            'version': info['version'],
            'rows': len(info['data']),
            'columns': len(info['data'].columns),
            'created_at': info['created_at']
        } for did, info in self.datasets.items()]
    
    def delete(self, dataset_id: str) -> bool:
        """Delete a dataset"""
        if dataset_id in self.datasets:
            del self.datasets[dataset_id]
            return True
        return False

