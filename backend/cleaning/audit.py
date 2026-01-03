"""
Audit Trail Module
Logs all data transformations for reproducibility
"""
import json
from datetime import datetime
from typing import List, Dict, Any


class AuditLogger:
    """
    Maintains an audit trail of all data transformations
    """
    
    def __init__(self, dataset_id=None):
        self.dataset_id = dataset_id
        self.entries: List[Dict[str, Any]] = []
        self.created_at = datetime.now()
    
    def log(self, action: str, details: Dict[str, Any], user: str = 'system'):
        """
        Log a transformation action
        """
        entry = {
            'timestamp': datetime.now().isoformat(),
            'action': action,
            'details': details,
            'user': user,
            'entry_number': len(self.entries) + 1
        }
        self.entries.append(entry)
        return entry
    
    def get_log(self) -> List[Dict[str, Any]]:
        """
        Get complete audit log
        """
        return {
            'dataset_id': self.dataset_id,
            'created_at': self.created_at.isoformat(),
            'total_entries': len(self.entries),
            'entries': self.entries
        }
    
    def get_summary(self) -> Dict[str, Any]:
        """
        Get summary of transformations
        """
        action_counts = {}
        for entry in self.entries:
            action = entry['action']
            action_counts[action] = action_counts.get(action, 0) + 1
        
        return {
            'dataset_id': self.dataset_id,
            'total_transformations': len(self.entries),
            'transformation_counts': action_counts,
            'first_transformation': self.entries[0]['timestamp'] if self.entries else None,
            'last_transformation': self.entries[-1]['timestamp'] if self.entries else None
        }
    
    def export_markdown(self) -> str:
        """
        Export audit trail as markdown document (for appendix)
        """
        lines = [
            "# Data Transformation Audit Trail",
            "",
            f"**Dataset ID:** {self.dataset_id}",
            f"**Created:** {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}",
            f"**Total Transformations:** {len(self.entries)}",
            "",
            "---",
            ""
        ]
        
        for entry in self.entries:
            lines.append(f"## Transformation {entry['entry_number']}: {entry['action']}")
            lines.append(f"**Timestamp:** {entry['timestamp']}")
            lines.append(f"**Performed by:** {entry['user']}")
            lines.append("")
            lines.append("**Details:**")
            
            for key, value in entry['details'].items():
                lines.append(f"- {key}: {value}")
            
            lines.append("")
            lines.append("---")
            lines.append("")
        
        return '\n'.join(lines)
    
    def export_json(self) -> str:
        """
        Export audit trail as JSON
        """
        return json.dumps(self.get_log(), indent=2)
    
    def clear(self):
        """
        Clear the audit log
        """
        self.entries = []
    
    def undo_last(self) -> Dict[str, Any]:
        """
        Remove and return the last entry (for undo functionality)
        """
        if self.entries:
            return self.entries.pop()
        return None


class DataVersionManager:
    """
    Manages versions of datasets through the cleaning process
    """
    
    def __init__(self):
        self.versions: Dict[str, Dict[str, Any]] = {}
        self.current_version = None
    
    def save_version(self, df, version_name: str, description: str = None):
        """
        Save a version of the dataset
        """
        import pandas as pd
        
        self.versions[version_name] = {
            'data': df.copy(),
            'timestamp': datetime.now().isoformat(),
            'description': description,
            'shape': df.shape,
            'columns': df.columns.tolist()
        }
        self.current_version = version_name
        
        return {
            'version': version_name,
            'rows': df.shape[0],
            'columns': df.shape[1],
            'saved_at': self.versions[version_name]['timestamp']
        }
    
    def get_version(self, version_name: str):
        """
        Retrieve a saved version
        """
        if version_name in self.versions:
            return self.versions[version_name]['data'].copy()
        return None
    
    def list_versions(self) -> List[Dict[str, Any]]:
        """
        List all saved versions
        """
        return [{
            'version': name,
            'timestamp': info['timestamp'],
            'description': info['description'],
            'shape': info['shape'],
            'is_current': name == self.current_version
        } for name, info in self.versions.items()]
    
    def compare_versions(self, version1: str, version2: str) -> Dict[str, Any]:
        """
        Compare two versions
        """
        if version1 not in self.versions or version2 not in self.versions:
            return {'error': 'One or both versions not found'}
        
        v1 = self.versions[version1]
        v2 = self.versions[version2]
        
        return {
            'version1': {
                'name': version1,
                'shape': v1['shape'],
                'columns': v1['columns']
            },
            'version2': {
                'name': version2,
                'shape': v2['shape'],
                'columns': v2['columns']
            },
            'differences': {
                'row_diff': v2['shape'][0] - v1['shape'][0],
                'col_diff': v2['shape'][1] - v1['shape'][1],
                'columns_added': list(set(v2['columns']) - set(v1['columns'])),
                'columns_removed': list(set(v1['columns']) - set(v2['columns']))
            }
        }

