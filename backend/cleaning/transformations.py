"""
Data Transformation Module
Recoding, creating derived variables, and data manipulation
"""
import pandas as pd
import numpy as np
from datetime import datetime


class DataTransformer:
    """
    Data transformation and recoding utilities
    """
    
    def __init__(self, audit_logger=None):
        self.audit_logger = audit_logger
    
    def _log_transformation(self, action, details):
        """Log transformation if audit logger is available"""
        if self.audit_logger:
            self.audit_logger.log(action, details)
    
    def remove_duplicates(self, df, subset=None, keep='first'):
        """
        Remove duplicate rows
        """
        original_count = len(df)
        df_clean = df.drop_duplicates(subset=subset, keep=keep)
        removed_count = original_count - len(df_clean)
        
        self._log_transformation('remove_duplicates', {
            'rows_removed': removed_count,
            'subset': subset,
            'keep': keep
        })
        
        return {
            'data': df_clean,
            'rows_removed': removed_count,
            'original_count': original_count,
            'new_count': len(df_clean)
        }
    
    def handle_missing(self, df, column, method='drop', fill_value=None):
        """
        Handle missing values in a column
        
        Methods:
        - drop: Remove rows with missing values
        - mean: Fill with mean (numeric only)
        - median: Fill with median (numeric only)
        - mode: Fill with mode
        - value: Fill with specified value
        - ffill: Forward fill
        - bfill: Backward fill
        """
        df_result = df.copy()
        missing_before = df_result[column].isna().sum()
        
        if method == 'drop':
            df_result = df_result.dropna(subset=[column])
        elif method == 'mean':
            fill = df_result[column].mean()
            df_result[column] = df_result[column].fillna(fill)
        elif method == 'median':
            fill = df_result[column].median()
            df_result[column] = df_result[column].fillna(fill)
        elif method == 'mode':
            fill = df_result[column].mode().iloc[0] if not df_result[column].mode().empty else None
            if fill is not None:
                df_result[column] = df_result[column].fillna(fill)
        elif method == 'value':
            df_result[column] = df_result[column].fillna(fill_value)
        elif method == 'ffill':
            df_result[column] = df_result[column].ffill()
        elif method == 'bfill':
            df_result[column] = df_result[column].bfill()
        
        missing_after = df_result[column].isna().sum()
        
        self._log_transformation('handle_missing', {
            'column': column,
            'method': method,
            'fill_value': str(fill_value) if fill_value else None,
            'missing_before': int(missing_before),
            'missing_after': int(missing_after)
        })
        
        return {
            'data': df_result,
            'column': column,
            'method': method,
            'missing_before': int(missing_before),
            'missing_after': int(missing_after),
            'imputed_count': int(missing_before - missing_after)
        }
    
    def create_age_groups(self, df, age_column, new_column=None, bins=None, labels=None):
        """
        Create age group categories from continuous age
        """
        if new_column is None:
            new_column = f'{age_column}_group'
        
        if bins is None:
            bins = [0, 18, 25, 35, 45, 55, 65, 100]
            labels = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']
        
        df_result = df.copy()
        df_result[new_column] = pd.cut(df_result[age_column], bins=bins, labels=labels, right=False)
        
        # Get distribution
        distribution = df_result[new_column].value_counts().to_dict()
        
        self._log_transformation('create_age_groups', {
            'source_column': age_column,
            'new_column': new_column,
            'bins': bins,
            'labels': labels
        })
        
        return {
            'data': df_result,
            'new_column': new_column,
            'distribution': {str(k): int(v) for k, v in distribution.items()}
        }
    
    def create_categories(self, df, column, new_column=None, method='quartiles', n_categories=4, custom_bins=None, custom_labels=None):
        """
        Create categorical variable from continuous
        
        Methods:
        - quartiles: Split into quartiles
        - quantiles: Split into n equal-sized groups
        - equal_width: Split into n equal-width bins
        - custom: Use custom bins and labels
        """
        if new_column is None:
            new_column = f'{column}_cat'
        
        df_result = df.copy()
        
        if method == 'quartiles':
            df_result[new_column] = pd.qcut(df_result[column], q=4, labels=['Q1 (Low)', 'Q2', 'Q3', 'Q4 (High)'])
        elif method == 'quantiles':
            labels = [f'G{i+1}' for i in range(n_categories)]
            df_result[new_column] = pd.qcut(df_result[column], q=n_categories, labels=labels, duplicates='drop')
        elif method == 'equal_width':
            labels = [f'Bin{i+1}' for i in range(n_categories)]
            df_result[new_column] = pd.cut(df_result[column], bins=n_categories, labels=labels)
        elif method == 'custom' and custom_bins is not None:
            df_result[new_column] = pd.cut(df_result[column], bins=custom_bins, labels=custom_labels)
        
        distribution = df_result[new_column].value_counts().to_dict()
        
        self._log_transformation('create_categories', {
            'source_column': column,
            'new_column': new_column,
            'method': method,
            'n_categories': n_categories
        })
        
        return {
            'data': df_result,
            'new_column': new_column,
            'distribution': {str(k): int(v) for k, v in distribution.items()}
        }
    
    def reverse_code(self, df, column, new_column=None, max_value=None):
        """
        Reverse code a Likert-scale item
        e.g., 1-5 scale: 1 becomes 5, 2 becomes 4, etc.
        """
        if new_column is None:
            new_column = f'{column}_r'
        
        df_result = df.copy()
        
        if max_value is None:
            max_value = df_result[column].max()
        min_value = df_result[column].min()
        
        df_result[new_column] = (max_value + min_value) - df_result[column]
        
        self._log_transformation('reverse_code', {
            'source_column': column,
            'new_column': new_column,
            'max_value': int(max_value),
            'min_value': int(min_value)
        })
        
        return {
            'data': df_result,
            'new_column': new_column,
            'original_range': f'{min_value}-{max_value}',
            'reversed': True
        }
    
    def compute_scale_score(self, df, items, new_column, method='mean', reverse_items=None, max_value=None):
        """
        Compute composite score from multiple items (e.g., survey scale)
        
        Methods:
        - mean: Average of items
        - sum: Sum of items
        """
        df_result = df.copy()
        
        # Handle reverse coded items
        items_to_use = items.copy()
        if reverse_items:
            for item in reverse_items:
                if item in items_to_use:
                    reversed_col = f'{item}_r'
                    if max_value is None:
                        max_value = df_result[item].max()
                    min_value = df_result[item].min()
                    df_result[reversed_col] = (max_value + min_value) - df_result[item]
                    items_to_use[items_to_use.index(item)] = reversed_col
        
        # Compute score
        if method == 'mean':
            df_result[new_column] = df_result[items_to_use].mean(axis=1)
        elif method == 'sum':
            df_result[new_column] = df_result[items_to_use].sum(axis=1)
        
        # Compute Cronbach's alpha
        from .reliability import compute_cronbachs_alpha
        alpha = compute_cronbachs_alpha(df_result[items_to_use])
        
        self._log_transformation('compute_scale_score', {
            'items': items,
            'new_column': new_column,
            'method': method,
            'reverse_items': reverse_items,
            'cronbachs_alpha': alpha
        })
        
        return {
            'data': df_result,
            'new_column': new_column,
            'items_used': items_to_use,
            'cronbachs_alpha': alpha,
            'mean': round(df_result[new_column].mean(), 4),
            'std': round(df_result[new_column].std(), 4)
        }
    
    def standardize(self, df, columns, method='zscore'):
        """
        Standardize numeric variables
        
        Methods:
        - zscore: (x - mean) / std
        - minmax: (x - min) / (max - min)
        """
        df_result = df.copy()
        
        if isinstance(columns, str):
            columns = [columns]
        
        standardized_cols = []
        for col in columns:
            new_col = f'{col}_z' if method == 'zscore' else f'{col}_scaled'
            
            if method == 'zscore':
                mean = df_result[col].mean()
                std = df_result[col].std()
                df_result[new_col] = (df_result[col] - mean) / std
            elif method == 'minmax':
                min_val = df_result[col].min()
                max_val = df_result[col].max()
                df_result[new_col] = (df_result[col] - min_val) / (max_val - min_val)
            
            standardized_cols.append(new_col)
        
        self._log_transformation('standardize', {
            'columns': columns,
            'method': method,
            'new_columns': standardized_cols
        })
        
        return {
            'data': df_result,
            'new_columns': standardized_cols,
            'method': method
        }
    
    def recode_values(self, df, column, mapping, new_column=None):
        """
        Recode values based on a mapping dictionary
        """
        if new_column is None:
            new_column = column
        
        df_result = df.copy()
        df_result[new_column] = df_result[column].replace(mapping)
        
        self._log_transformation('recode_values', {
            'column': column,
            'new_column': new_column,
            'mapping': {str(k): str(v) for k, v in mapping.items()}
        })
        
        return {
            'data': df_result,
            'column': new_column,
            'mapping_applied': mapping
        }
    
    def winsorize_outliers(self, df, column, lower_percentile=0.05, upper_percentile=0.95):
        """
        Winsorize outliers (replace with percentile values)
        """
        df_result = df.copy()
        
        lower_val = df_result[column].quantile(lower_percentile)
        upper_val = df_result[column].quantile(upper_percentile)
        
        original_min = df_result[column].min()
        original_max = df_result[column].max()
        
        df_result[column] = df_result[column].clip(lower=lower_val, upper=upper_val)
        
        self._log_transformation('winsorize_outliers', {
            'column': column,
            'lower_percentile': lower_percentile,
            'upper_percentile': upper_percentile,
            'lower_bound': round(lower_val, 4),
            'upper_bound': round(upper_val, 4),
            'original_range': f'{round(original_min, 4)} - {round(original_max, 4)}'
        })
        
        return {
            'data': df_result,
            'column': column,
            'bounds': {'lower': round(lower_val, 4), 'upper': round(upper_val, 4)},
            'original_range': {'min': round(original_min, 4), 'max': round(original_max, 4)}
        }
    
    def log_transform(self, df, column, new_column=None, add_constant=1):
        """
        Apply log transformation (useful for right-skewed data)
        """
        if new_column is None:
            new_column = f'{column}_log'
        
        df_result = df.copy()
        df_result[new_column] = np.log(df_result[column] + add_constant)
        
        self._log_transformation('log_transform', {
            'column': column,
            'new_column': new_column,
            'add_constant': add_constant
        })
        
        return {
            'data': df_result,
            'new_column': new_column,
            'original_skewness': round(df_result[column].skew(), 4),
            'transformed_skewness': round(df_result[new_column].skew(), 4)
        }


def compute_cronbachs_alpha(df):
    """
    Compute Cronbach's alpha for internal consistency
    """
    try:
        df_clean = df.dropna()
        n_items = df_clean.shape[1]
        
        if n_items < 2:
            return None
        
        item_variances = df_clean.var(axis=0, ddof=1).sum()
        total_variance = df_clean.sum(axis=1).var(ddof=1)
        
        if total_variance == 0:
            return None
        
        alpha = (n_items / (n_items - 1)) * (1 - item_variances / total_variance)
        
        return round(alpha, 4)
    except:
        return None

