"""
Data Quality Checking Module
Automated data quality assessment and issue detection
All comparisons and values are explicitly converted to Python primitives.
"""
import pandas as pd
import numpy as np
from datetime import datetime


def safe_int(val):
    """Safely convert to Python int"""
    try:
        if pd.isna(val):
            return 0
        return int(val)
    except:
        return 0


def safe_float(val, decimals=4):
    """Safely convert to Python float with rounding"""
    try:
        if pd.isna(val):
            return None
        return round(float(val), decimals)
    except:
        return None


def safe_bool(val):
    """Safely convert to Python bool"""
    try:
        if isinstance(val, (np.ndarray, pd.Series)):
            return bool(val.any())
        return bool(val)
    except:
        return False


class DataQualityChecker:
    """
    Comprehensive data quality assessment
    """
    
    def __init__(self):
        self.issues = []
    
    def run_full_quality_check(self, df):
        """
        Run all quality checks and return comprehensive report
        """
        self.issues = []
        
        try:
            report = {
                'timestamp': datetime.now().isoformat(),
                'dataset_info': self._get_dataset_info(df),
                'duplicates': self.check_duplicates(df),
                'missing_data': self.check_missing_data(df),
                'outliers': self.check_outliers(df),
                'data_types': self.check_data_types(df),
                'value_ranges': self.check_value_ranges(df),
                'category_issues': self.check_category_issues(df),
                'summary': {}
            }
            
            # Summarize issues
            total_issues = 0
            critical_issues = 0
            
            for check_name, check_result in report.items():
                if isinstance(check_result, dict) and 'issues_count' in check_result:
                    total_issues += safe_int(check_result.get('issues_count', 0))
                    if check_result.get('critical', False):
                        critical_issues += safe_int(check_result.get('issues_count', 0))
            
            report['summary'] = {
                'total_issues': total_issues,
                'critical_issues': critical_issues,
                'data_quality_score': max(0, 100 - (total_issues * 5) - (critical_issues * 10)),
                'recommendation': 'proceed_with_caution' if critical_issues > 0 else ('clean_data' if total_issues > 0 else 'ready_for_analysis')
            }
            
            return report
        except Exception as e:
            return {
                'timestamp': datetime.now().isoformat(),
                'error': str(e),
                'dataset_info': {'rows': len(df), 'columns': len(df.columns)},
                'summary': {'total_issues': 0, 'critical_issues': 0, 'data_quality_score': 50, 'recommendation': 'error_occurred'}
            }
    
    def _get_dataset_info(self, df):
        """Get basic dataset information"""
        try:
            return {
                'rows': len(df),
                'columns': len(df.columns),
                'memory_usage_mb': safe_float(df.memory_usage(deep=True).sum() / 1024 / 1024, 2),
                'column_names': [str(c) for c in df.columns.tolist()]
            }
        except Exception as e:
            return {'rows': 0, 'columns': 0, 'error': str(e)}
    
    def check_duplicates(self, df):
        """
        Check for duplicate rows
        """
        try:
            exact_duplicates = safe_int(df.duplicated().sum())
            n_rows = len(df)
            
            duplicate_indices = []
            if exact_duplicates > 0:
                try:
                    duplicate_indices = [safe_int(i) for i in df[df.duplicated(keep='first')].index.tolist()[:10]]
                except:
                    duplicate_indices = []
            
            is_critical = exact_duplicates > (n_rows * 0.1) if n_rows > 0 else False
            
            return {
                'exact_duplicates': exact_duplicates,
                'percentage': safe_float(exact_duplicates / n_rows * 100 if n_rows > 0 else 0, 2),
                'duplicate_row_indices': duplicate_indices,
                'issues_count': 1 if exact_duplicates > 0 else 0,
                'critical': is_critical,
                'suggestion': 'Consider removing duplicate rows' if exact_duplicates > 0 else None
            }
        except Exception as e:
            return {'exact_duplicates': 0, 'issues_count': 0, 'critical': False, 'error': str(e)}
    
    def check_missing_data(self, df):
        """
        Comprehensive missing data analysis
        """
        try:
            missing_by_column = {}
            columns_with_missing = 0
            high_missing_columns = []
            n_rows = len(df)
            
            for col in df.columns:
                try:
                    missing_count = safe_int(df[col].isna().sum())
                    missing_pct = safe_float(missing_count / n_rows * 100 if n_rows > 0 else 0, 2) or 0
                    
                    if missing_count > 0:
                        columns_with_missing += 1
                        
                        missing_by_column[str(col)] = {
                            'missing_count': missing_count,
                            'missing_percentage': missing_pct,
                            'severity': 'high' if missing_pct > 20 else ('medium' if missing_pct > 5 else 'low')
                        }
                        
                        if missing_pct > 20:
                            high_missing_columns.append(str(col))
                except:
                    continue
            
            total_cells = n_rows * len(df.columns)
            total_missing = safe_int(df.isna().sum().sum())
            
            return {
                'total_missing_cells': total_missing,
                'total_cells': total_cells,
                'overall_missing_percentage': safe_float(total_missing / total_cells * 100 if total_cells > 0 else 0, 2) or 0,
                'columns_with_missing': columns_with_missing,
                'by_column': missing_by_column,
                'high_missing_columns': high_missing_columns,
                'pattern_analysis': None,
                'issues_count': columns_with_missing,
                'critical': len(high_missing_columns) > 0,
                'suggestions': self._missing_data_suggestions(missing_by_column)
            }
        except Exception as e:
            return {'total_missing_cells': 0, 'issues_count': 0, 'critical': False, 'error': str(e)}
    
    def _missing_data_suggestions(self, missing_by_column):
        """Generate suggestions for handling missing data"""
        suggestions = []
        try:
            for col, info in missing_by_column.items():
                pct = info.get('missing_percentage', 0) or 0
                
                if pct > 50:
                    suggestions.append(f"Consider dropping column '{col}' (>{pct:.1f}% missing)")
                elif pct > 20:
                    suggestions.append(f"Column '{col}' has high missingness ({pct:.1f}%). Consider imputation")
                elif pct > 5:
                    suggestions.append(f"Column '{col}' has moderate missingness ({pct:.1f}%)")
                else:
                    suggestions.append(f"Column '{col}' has low missingness ({pct:.1f}%)")
        except:
            pass
        return suggestions
    
    def check_outliers(self, df):
        """
        Detect outliers using IQR method
        """
        outlier_summary = {}
        total_outliers = 0
        
        try:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            for col in numeric_cols:
                try:
                    col_data = df[col].dropna()
                    
                    if len(col_data) < 4:
                        continue
                    
                    Q1 = float(col_data.quantile(0.25))
                    Q3 = float(col_data.quantile(0.75))
                    IQR = Q3 - Q1
                    lower_bound = Q1 - 1.5 * IQR
                    upper_bound = Q3 + 1.5 * IQR
                    
                    outlier_mask = (col_data < lower_bound) | (col_data > upper_bound)
                    iqr_outliers = safe_int(outlier_mask.sum())
                    
                    if iqr_outliers > 0:
                        n_data = len(col_data)
                        pct = safe_float(iqr_outliers / n_data * 100 if n_data > 0 else 0, 2) or 0
                        
                        outlier_vals = col_data[outlier_mask].head(5).tolist()
                        
                        outlier_summary[str(col)] = {
                            'iqr_outliers': iqr_outliers,
                            'z_score_outliers': 0,
                            'percentage': pct,
                            'bounds': {
                                'lower': safe_float(lower_bound),
                                'upper': safe_float(upper_bound)
                            },
                            'sample_outlier_values': [safe_float(v) for v in outlier_vals],
                            'suggestion': 'investigate' if pct < 5 else 'winsorize_or_transform'
                        }
                        
                        total_outliers += iqr_outliers
                except:
                    continue
            
            # Check if any column has high percentage of outliers
            has_critical = False
            for info in outlier_summary.values():
                if info.get('percentage', 0) > 10:
                    has_critical = True
                    break
            
            return {
                'columns_with_outliers': len(outlier_summary),
                'by_column': outlier_summary,
                'total_outlier_values': total_outliers,
                'issues_count': len(outlier_summary),
                'critical': has_critical
            }
        except Exception as e:
            return {'columns_with_outliers': 0, 'issues_count': 0, 'critical': False, 'error': str(e)}
    
    def check_data_types(self, df):
        """
        Check and suggest appropriate data types
        """
        type_issues = {}
        
        try:
            for col in df.columns:
                try:
                    current_type = str(df[col].dtype)
                    suggested_type = current_type
                    issue = None
                    
                    if df[col].dtype == 'object':
                        try:
                            numeric = pd.to_numeric(df[col], errors='coerce')
                            non_numeric = safe_int(numeric.isna().sum()) - safe_int(df[col].isna().sum())
                            if non_numeric == 0 and safe_int(numeric.notna().sum()) > 0:
                                suggested_type = 'float64'
                                issue = 'Numeric values stored as text'
                        except:
                            pass
                    
                    if pd.api.types.is_numeric_dtype(df[col]):
                        n_unique = safe_int(df[col].nunique())
                        n_rows = len(df)
                        unique_ratio = n_unique / n_rows if n_rows > 0 else 0
                        if unique_ratio < 0.05 and n_unique < 10:
                            suggested_type = 'category'
                            issue = 'Low cardinality numeric - consider as categorical'
                    
                    if issue:
                        type_issues[str(col)] = {
                            'current_type': current_type,
                            'suggested_type': suggested_type,
                            'issue': issue
                        }
                except:
                    continue
            
            return {
                'columns_with_type_issues': len(type_issues),
                'issues': type_issues,
                'issues_count': len(type_issues),
                'critical': False
            }
        except Exception as e:
            return {'columns_with_type_issues': 0, 'issues_count': 0, 'critical': False, 'error': str(e)}
    
    def check_value_ranges(self, df):
        """
        Check for invalid value ranges
        """
        range_issues = {}
        
        try:
            patterns = {
                'age': {'min': 0, 'max': 120},
                'percentage': {'min': 0, 'max': 100},
                'year': {'min': 1900, 'max': 2100},
                'score': {'min': 0, 'max': None},
                'rating': {'min': 1, 'max': 5},
                'count': {'min': 0, 'max': None},
            }
            
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            for col in numeric_cols:
                try:
                    col_lower = str(col).lower()
                    
                    for pattern_name, bounds in patterns.items():
                        if pattern_name in col_lower:
                            col_data = df[col].dropna()
                            issues = []
                            
                            if len(col_data) == 0:
                                break
                            
                            col_min = float(col_data.min())
                            col_max = float(col_data.max())
                            
                            if bounds['min'] is not None and col_min < bounds['min']:
                                below_min = safe_int((col_data < bounds['min']).sum())
                                issues.append(f"{below_min} values below minimum ({bounds['min']})")
                            
                            if bounds['max'] is not None and col_max > bounds['max']:
                                above_max = safe_int((col_data > bounds['max']).sum())
                                issues.append(f"{above_max} values above maximum ({bounds['max']})")
                            
                            if issues:
                                range_issues[str(col)] = {
                                    'expected_range': bounds,
                                    'actual_range': {
                                        'min': safe_float(col_min),
                                        'max': safe_float(col_max)
                                    },
                                    'issues': issues
                                }
                            break
                except:
                    continue
            
            return {
                'columns_with_range_issues': len(range_issues),
                'issues': range_issues,
                'issues_count': len(range_issues),
                'critical': len(range_issues) > 0
            }
        except Exception as e:
            return {'columns_with_range_issues': 0, 'issues_count': 0, 'critical': False, 'error': str(e)}
    
    def check_category_issues(self, df):
        """
        Check for inconsistent categories
        """
        category_issues = {}
        
        try:
            cat_cols = df.select_dtypes(include=['object', 'category']).columns
            
            for col in cat_cols:
                try:
                    unique_vals = df[col].dropna().unique()
                    
                    if len(unique_vals) > 100:
                        continue
                    
                    issues = []
                    
                    # Check for case variations
                    lower_vals = [str(v).lower().strip() for v in unique_vals]
                    if len(lower_vals) != len(set(lower_vals)):
                        issues.append("Case variations detected")
                    
                    # Check for sparse categories
                    value_counts = df[col].value_counts()
                    sparse = [str(v) for v in value_counts[value_counts < 5].index.tolist()[:5]]
                    if sparse:
                        issues.append(f"Sparse categories (n<5): {sparse}")
                    
                    if issues:
                        category_issues[str(col)] = {
                            'unique_values': len(unique_vals),
                            'issues': issues[:10]
                        }
                except:
                    continue
            
            total_issues = sum(len(v.get('issues', [])) for v in category_issues.values())
            
            return {
                'columns_with_category_issues': len(category_issues),
                'issues': category_issues,
                'issues_count': total_issues,
                'critical': False
            }
        except Exception as e:
            return {'columns_with_category_issues': 0, 'issues_count': 0, 'critical': False, 'error': str(e)}
    
    def generate_data_dictionary(self, df):
        """
        Auto-generate a data dictionary
        """
        dictionary = []
        
        try:
            for col in df.columns:
                try:
                    col_data = df[col]
                    n_total = len(col_data)
                    n_missing = safe_int(col_data.isna().sum())
                    
                    entry = {
                        'variable_name': str(col),
                        'data_type': str(col_data.dtype),
                        'n_total': n_total,
                        'n_valid': safe_int(col_data.count()),
                        'n_missing': n_missing,
                        'missing_percentage': safe_float(n_missing / n_total * 100 if n_total > 0 else 0, 2) or 0
                    }
                    
                    if pd.api.types.is_numeric_dtype(col_data):
                        n_unique = safe_int(col_data.nunique())
                        has_values = safe_int(col_data.notna().sum()) > 0
                        
                        entry.update({
                            'variable_type': 'continuous' if n_unique > 10 else 'discrete',
                            'min': safe_float(col_data.min()) if has_values else None,
                            'max': safe_float(col_data.max()) if has_values else None,
                            'mean': safe_float(col_data.mean()) if has_values else None,
                            'unique_values': n_unique
                        })
                    else:
                        unique_vals = col_data.dropna().unique().tolist()
                        n_unique = len(unique_vals)
                        
                        categories = [str(v) for v in unique_vals[:20]] if n_unique <= 20 else f'{n_unique} unique values'
                        
                        entry.update({
                            'variable_type': 'categorical',
                            'unique_values': n_unique,
                            'categories': categories
                        })
                    
                    dictionary.append(entry)
                except Exception as col_error:
                    dictionary.append({
                        'variable_name': str(col),
                        'error': str(col_error)
                    })
            
            return {
                'version': 'v1_raw',
                'generated_at': datetime.now().isoformat(),
                'variables': dictionary
            }
        except Exception as e:
            return {
                'version': 'v1_raw',
                'error': str(e),
                'variables': []
            }
