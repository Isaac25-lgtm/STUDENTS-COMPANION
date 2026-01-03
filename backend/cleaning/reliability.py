"""
Reliability Analysis Module
Cronbach's alpha and other reliability measures
"""
import numpy as np
import pandas as pd


def compute_cronbachs_alpha(df):
    """
    Compute Cronbach's alpha for internal consistency reliability
    
    Args:
        df: DataFrame with items (each column is an item)
    
    Returns:
        float: Cronbach's alpha value
    """
    try:
        df_clean = df.dropna()
        n_items = df_clean.shape[1]
        
        if n_items < 2:
            return None
        
        # Variance of each item
        item_variances = df_clean.var(axis=0, ddof=1).sum()
        
        # Variance of total scores
        total_variance = df_clean.sum(axis=1).var(ddof=1)
        
        if total_variance == 0:
            return None
        
        # Cronbach's alpha formula
        alpha = (n_items / (n_items - 1)) * (1 - item_variances / total_variance)
        
        return round(alpha, 4)
    except Exception as e:
        return None


def compute_item_total_correlations(df):
    """
    Compute corrected item-total correlations
    
    Args:
        df: DataFrame with items
    
    Returns:
        dict: Item-total correlations for each item
    """
    try:
        df_clean = df.dropna()
        total = df_clean.sum(axis=1)
        
        correlations = {}
        for col in df_clean.columns:
            # Corrected item-total correlation (exclude the item from total)
            corrected_total = total - df_clean[col]
            r = df_clean[col].corr(corrected_total)
            correlations[col] = round(r, 4)
        
        return correlations
    except Exception as e:
        return None


def compute_alpha_if_deleted(df):
    """
    Compute Cronbach's alpha if each item were deleted
    
    Args:
        df: DataFrame with items
    
    Returns:
        dict: Alpha values if each item were deleted
    """
    try:
        alpha_if_deleted = {}
        
        for col in df.columns:
            remaining_items = df.drop(columns=[col])
            alpha = compute_cronbachs_alpha(remaining_items)
            alpha_if_deleted[col] = alpha
        
        return alpha_if_deleted
    except Exception as e:
        return None


def full_reliability_analysis(df, scale_name="Scale"):
    """
    Comprehensive reliability analysis
    
    Args:
        df: DataFrame with scale items
        scale_name: Name of the scale
    
    Returns:
        dict: Complete reliability analysis results
    """
    try:
        # Overall alpha
        alpha = compute_cronbachs_alpha(df)
        
        # Item-total correlations
        item_total = compute_item_total_correlations(df)
        
        # Alpha if deleted
        alpha_deleted = compute_alpha_if_deleted(df)
        
        # Item statistics
        item_stats = []
        for col in df.columns:
            stats = {
                'item': col,
                'mean': round(df[col].mean(), 4),
                'std': round(df[col].std(), 4),
                'item_total_r': item_total.get(col) if item_total else None,
                'alpha_if_deleted': alpha_deleted.get(col) if alpha_deleted else None
            }
            item_stats.append(stats)
        
        # Interpretation
        if alpha is None:
            interpretation = "Could not calculate"
        elif alpha >= 0.9:
            interpretation = "Excellent"
        elif alpha >= 0.8:
            interpretation = "Good"
        elif alpha >= 0.7:
            interpretation = "Acceptable"
        elif alpha >= 0.6:
            interpretation = "Questionable"
        elif alpha >= 0.5:
            interpretation = "Poor"
        else:
            interpretation = "Unacceptable"
        
        # Recommendations
        recommendations = []
        if item_total:
            for item, r in item_total.items():
                if r and r < 0.3:
                    recommendations.append(f"Consider removing '{item}' (low item-total correlation: {r})")
        
        if alpha_deleted:
            for item, a in alpha_deleted.items():
                if a and alpha and a > alpha + 0.05:
                    recommendations.append(f"Removing '{item}' would improve alpha from {alpha} to {a}")
        
        return {
            'scale_name': scale_name,
            'n_items': len(df.columns),
            'n_valid_cases': len(df.dropna()),
            'cronbachs_alpha': alpha,
            'interpretation': interpretation,
            'item_statistics': item_stats,
            'recommendations': recommendations if recommendations else ['Scale reliability is adequate. No items need removal.']
        }
    except Exception as e:
        return {'error': str(e)}

