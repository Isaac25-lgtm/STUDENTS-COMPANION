"""
Assumption Checking Module
Validates statistical assumptions before running tests
"""
import numpy as np
import pandas as pd
from scipy import stats
from scipy.stats import shapiro, levene, bartlett, normaltest
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor
from statsmodels.stats.diagnostic import het_breuschpagan, het_white
from statsmodels.stats.stattools import durbin_watson


class AssumptionChecker:
    """
    Comprehensive assumption checking for statistical tests
    """
    
    def __init__(self, alpha=0.05):
        self.alpha = alpha
    
    def check_normality(self, data, variable_name=None):
        """
        Check normality assumption using multiple tests
        """
        try:
            data = pd.Series(data).dropna()
            n = len(data)
            
            results = {
                'variable': variable_name,
                'sample_size': n,
                'tests': {}
            }
            
            # Shapiro-Wilk (best for n < 5000)
            if n >= 3 and n <= 5000:
                shapiro_stat, shapiro_p = shapiro(data)
                results['tests']['shapiro_wilk'] = {
                    'statistic': round(shapiro_stat, 4),
                    'p_value': round(shapiro_p, 4),
                    'normal': shapiro_p > self.alpha
                }
            
            # D'Agostino-Pearson (for n >= 20)
            if n >= 20:
                try:
                    dagostino_stat, dagostino_p = normaltest(data)
                    results['tests']['dagostino_pearson'] = {
                        'statistic': round(dagostino_stat, 4),
                        'p_value': round(dagostino_p, 4),
                        'normal': dagostino_p > self.alpha
                    }
                except:
                    pass
            
            # Descriptive indicators
            skewness = data.skew()
            kurtosis = data.kurtosis()
            
            results['descriptive'] = {
                'skewness': round(skewness, 4),
                'kurtosis': round(kurtosis, 4),
                'skewness_concern': abs(skewness) > 2,
                'kurtosis_concern': abs(kurtosis) > 7
            }
            
            # Overall conclusion
            test_results = [t.get('normal', True) for t in results['tests'].values()]
            results['conclusion'] = {
                'normal': all(test_results) if test_results else None,
                'recommendation': 'parametric' if all(test_results) else 'non-parametric'
            }
            
            return results
            
        except Exception as e:
            return {'error': str(e)}
    
    def check_homogeneity_of_variance(self, groups, group_names=None):
        """
        Check homogeneity of variance (homoscedasticity) for group comparisons
        """
        try:
            results = {
                'n_groups': len(groups),
                'tests': {}
            }
            
            # Filter out NaN values from each group
            clean_groups = [pd.Series(g).dropna().values for g in groups]
            
            # Levene's test (robust to non-normality)
            levene_stat, levene_p = levene(*clean_groups)
            results['tests']['levene'] = {
                'statistic': round(levene_stat, 4),
                'p_value': round(levene_p, 4),
                'equal_variance': levene_p > self.alpha
            }
            
            # Bartlett's test (assumes normality)
            try:
                bartlett_stat, bartlett_p = bartlett(*clean_groups)
                results['tests']['bartlett'] = {
                    'statistic': round(bartlett_stat, 4),
                    'p_value': round(bartlett_p, 4),
                    'equal_variance': bartlett_p > self.alpha
                }
            except:
                pass
            
            # Group variances
            group_variances = []
            for i, g in enumerate(clean_groups):
                name = group_names[i] if group_names and i < len(group_names) else f'Group {i+1}'
                group_variances.append({
                    'group': name,
                    'n': len(g),
                    'variance': round(np.var(g, ddof=1), 4),
                    'std': round(np.std(g, ddof=1), 4)
                })
            
            results['group_variances'] = group_variances
            
            # Variance ratio (Hartley's F-max)
            variances = [g['variance'] for g in group_variances if g['variance'] > 0]
            if variances:
                results['variance_ratio'] = round(max(variances) / min(variances), 4)
                results['variance_ratio_concern'] = results['variance_ratio'] > 3
            
            # Overall conclusion
            results['conclusion'] = {
                'equal_variance': results['tests']['levene']['equal_variance'],
                'recommendation': 'proceed' if results['tests']['levene']['equal_variance'] else 'use_welch_or_nonparametric'
            }
            
            return results
            
        except Exception as e:
            return {'error': str(e)}
    
    def check_multicollinearity(self, df, predictors):
        """
        Check multicollinearity using VIF
        """
        try:
            # Clean data
            df_clean = df[predictors].dropna()
            
            if len(predictors) < 2:
                return {'message': 'VIF requires at least 2 predictors'}
            
            # Calculate VIF for each predictor
            vif_results = []
            for i, var in enumerate(predictors):
                vif = variance_inflation_factor(df_clean.values, i)
                vif_results.append({
                    'variable': var,
                    'VIF': round(vif, 4),
                    'concern': vif > 5,
                    'severe': vif > 10
                })
            
            # Correlation matrix
            corr_matrix = df_clean.corr().round(4).to_dict()
            
            # Find problematic pairs (|r| > 0.8)
            high_correlations = []
            corr_df = df_clean.corr()
            for i, var1 in enumerate(predictors):
                for j, var2 in enumerate(predictors):
                    if i < j:
                        r = corr_df.loc[var1, var2]
                        if abs(r) > 0.8:
                            high_correlations.append({
                                'variable1': var1,
                                'variable2': var2,
                                'correlation': round(r, 4)
                            })
            
            results = {
                'vif': vif_results,
                'correlation_matrix': corr_matrix,
                'high_correlations': high_correlations,
                'conclusion': {
                    'multicollinearity_present': any(v['concern'] for v in vif_results),
                    'severe_multicollinearity': any(v['severe'] for v in vif_results),
                    'recommendation': 'consider_removing' if any(v['severe'] for v in vif_results) else 'proceed'
                }
            }
            
            return results
            
        except Exception as e:
            return {'error': str(e)}
    
    def check_independence(self, residuals):
        """
        Check independence of residuals (for regression)
        """
        try:
            residuals = pd.Series(residuals).dropna()
            
            # Durbin-Watson test
            dw = durbin_watson(residuals)
            
            # Interpretation
            if dw < 1.5:
                interpretation = 'positive autocorrelation'
                concern = True
            elif dw > 2.5:
                interpretation = 'negative autocorrelation'
                concern = True
            else:
                interpretation = 'no significant autocorrelation'
                concern = False
            
            return {
                'durbin_watson': round(dw, 4),
                'interpretation': interpretation,
                'concern': concern,
                'recommendation': 'consider_time_series_methods' if concern else 'proceed'
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def check_linearity(self, x, y):
        """
        Check linearity assumption for regression
        """
        try:
            x = pd.Series(x).dropna()
            y = pd.Series(y).dropna()
            
            # Align data
            df = pd.DataFrame({'x': x, 'y': y}).dropna()
            x, y = df['x'], df['y']
            
            # Fit linear model
            X = sm.add_constant(x)
            model = sm.OLS(y, X).fit()
            
            # Residuals
            residuals = model.resid
            fitted = model.fittedvalues
            
            # Check for patterns in residuals
            # Correlation between fitted values and residuals (should be near 0)
            resid_corr = np.corrcoef(fitted, residuals)[0, 1]
            
            # Rainbow test for linearity
            from statsmodels.stats.diagnostic import linear_rainbow
            try:
                rainbow_stat, rainbow_p = linear_rainbow(model)
                rainbow_result = {
                    'statistic': round(rainbow_stat, 4),
                    'p_value': round(rainbow_p, 4),
                    'linear': rainbow_p > self.alpha
                }
            except:
                rainbow_result = None
            
            return {
                'residual_fitted_correlation': round(resid_corr, 4),
                'correlation_concern': abs(resid_corr) > 0.3,
                'rainbow_test': rainbow_result,
                'conclusion': {
                    'linear': abs(resid_corr) < 0.3,
                    'recommendation': 'proceed' if abs(resid_corr) < 0.3 else 'consider_transformation'
                }
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def check_homoscedasticity_regression(self, model_or_residuals, X):
        """
        Check homoscedasticity for regression residuals
        """
        try:
            if hasattr(model_or_residuals, 'resid'):
                residuals = model_or_residuals.resid
            else:
                residuals = model_or_residuals
            
            # Add constant if not present
            if not (X.iloc[:, 0] == 1).all():
                X = sm.add_constant(X)
            
            # Breusch-Pagan test
            bp_stat, bp_p, _, _ = het_breuschpagan(residuals, X)
            
            # White's test
            try:
                white_stat, white_p, _, _ = het_white(residuals, X)
                white_result = {
                    'statistic': round(white_stat, 4),
                    'p_value': round(white_p, 4),
                    'homoscedastic': white_p > self.alpha
                }
            except:
                white_result = None
            
            return {
                'breusch_pagan': {
                    'statistic': round(bp_stat, 4),
                    'p_value': round(bp_p, 4),
                    'homoscedastic': bp_p > self.alpha
                },
                'white': white_result,
                'conclusion': {
                    'homoscedastic': bp_p > self.alpha,
                    'recommendation': 'proceed' if bp_p > self.alpha else 'use_robust_standard_errors'
                }
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def run_all_checks(self, df, outcome, predictors, test_type='regression'):
        """
        Run all relevant assumption checks based on test type
        """
        results = {'test_type': test_type}
        
        if test_type == 'regression':
            # Normality of outcome
            results['normality'] = self.check_normality(df[outcome], outcome)
            
            # Multicollinearity
            if len(predictors) > 1:
                results['multicollinearity'] = self.check_multicollinearity(df, predictors)
            
            # Note: linearity and homoscedasticity need model residuals
            results['note'] = 'Run regression first, then check residuals for linearity and homoscedasticity'
            
        elif test_type == 'ttest':
            # For t-test with grouping variable
            pass
            
        elif test_type == 'anova':
            # For ANOVA
            pass
        
        return results

