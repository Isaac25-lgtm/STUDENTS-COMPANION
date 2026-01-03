"""
Statistical Analysis Module
All statistical calculations are done here in Python - NO AI hallucination.
Results are accurate and reproducible.
"""
import numpy as np
import pandas as pd
from scipy import stats
from scipy.stats import (
    ttest_ind, ttest_rel, f_oneway, mannwhitneyu, kruskal,
    chi2_contingency, fisher_exact, pearsonr, spearmanr,
    shapiro, levene, normaltest
)
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor
from statsmodels.stats.diagnostic import het_breuschpagan
from statsmodels.stats.stattools import durbin_watson
from statsmodels.formula.api import ols, logit, poisson, negativebinomial
import warnings
warnings.filterwarnings('ignore')


class StatisticalAnalyzer:
    """
    Core statistical analysis class.
    All calculations are done in Python for accuracy.
    """
    
    def __init__(self, alpha=0.05):
        self.alpha = alpha
        self.effect_size_thresholds = {
            'cohens_d': {'small': 0.2, 'medium': 0.5, 'large': 0.8},
            'r': {'small': 0.1, 'medium': 0.3, 'large': 0.5},
            'eta_squared': {'small': 0.01, 'medium': 0.06, 'large': 0.14},
            'cramers_v': {'small': 0.1, 'medium': 0.3, 'large': 0.5},
            'r_squared': {'small': 0.02, 'medium': 0.13, 'large': 0.26}
        }
    
    def _interpret_effect_size(self, value, metric):
        """Interpret effect size magnitude"""
        thresholds = self.effect_size_thresholds.get(metric, {})
        if not thresholds:
            return 'unknown'
        
        abs_value = abs(value)
        if abs_value < thresholds['small']:
            return 'negligible'
        elif abs_value < thresholds['medium']:
            return 'small'
        elif abs_value < thresholds['large']:
            return 'medium'
        else:
            return 'large'
    
    def _cohens_d(self, group1, group2):
        """Calculate Cohen's d effect size"""
        n1, n2 = len(group1), len(group2)
        var1, var2 = group1.var(), group2.var()
        
        # Pooled standard deviation
        pooled_std = np.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))
        
        if pooled_std == 0:
            return 0.0
        
        d = (group1.mean() - group2.mean()) / pooled_std
        return d
    
    def _cohens_d_ci(self, d, n1, n2, confidence=0.95):
        """Calculate confidence interval for Cohen's d"""
        se = np.sqrt((n1 + n2) / (n1 * n2) + (d ** 2) / (2 * (n1 + n2)))
        z = stats.norm.ppf((1 + confidence) / 2)
        return (d - z * se, d + z * se)
    
    def run_ttest(self, df, group_var, outcome_var, paired=False):
        """
        Run t-test (independent or paired)
        
        Returns complete statistical results for AI interpretation.
        """
        try:
            df_clean = df[[group_var, outcome_var]].dropna()
            
            if paired:
                # Paired t-test (requires two columns of measurements)
                groups = df_clean[group_var].unique()
                if len(groups) != 2:
                    return {'error': 'Paired t-test requires exactly 2 groups'}
                
                group1_data = df_clean[df_clean[group_var] == groups[0]][outcome_var]
                group2_data = df_clean[df_clean[group_var] == groups[1]][outcome_var]
                
                if len(group1_data) != len(group2_data):
                    return {'error': 'Paired t-test requires equal sample sizes'}
                
                t_stat, p_value = ttest_rel(group1_data, group2_data)
                test_type = 'Paired Samples t-test'
            else:
                # Independent t-test
                groups = df_clean[group_var].unique()
                if len(groups) != 2:
                    return {'error': f'T-test requires exactly 2 groups, found {len(groups)}'}
                
                group1_data = df_clean[df_clean[group_var] == groups[0]][outcome_var]
                group2_data = df_clean[df_clean[group_var] == groups[1]][outcome_var]
                
                # Levene's test for homogeneity of variance
                levene_stat, levene_p = levene(group1_data, group2_data)
                equal_var = levene_p > self.alpha
                
                t_stat, p_value = ttest_ind(group1_data, group2_data, equal_var=equal_var)
                test_type = "Independent Samples t-test (Welch's)" if not equal_var else "Independent Samples t-test"
            
            # Effect size (Cohen's d)
            cohens_d = self._cohens_d(group1_data, group2_data)
            d_ci = self._cohens_d_ci(cohens_d, len(group1_data), len(group2_data))
            
            # Mean difference and CI
            mean_diff = group1_data.mean() - group2_data.mean()
            se_diff = np.sqrt(group1_data.var()/len(group1_data) + group2_data.var()/len(group2_data))
            t_crit = stats.t.ppf(0.975, len(group1_data) + len(group2_data) - 2)
            diff_ci = (mean_diff - t_crit * se_diff, mean_diff + t_crit * se_diff)
            
            # Normality checks
            normality_g1 = shapiro(group1_data) if len(group1_data) >= 3 else (None, None)
            normality_g2 = shapiro(group2_data) if len(group2_data) >= 3 else (None, None)
            
            return {
                'test_type': test_type,
                'test_statistic': round(t_stat, 4),
                'degrees_of_freedom': len(group1_data) + len(group2_data) - 2,
                'p_value': round(p_value, 4),
                'significant': p_value < self.alpha,
                'alpha': self.alpha,
                'effect_size': {
                    'cohens_d': round(cohens_d, 4),
                    'ci_95': (round(d_ci[0], 4), round(d_ci[1], 4)),
                    'interpretation': self._interpret_effect_size(cohens_d, 'cohens_d')
                },
                'mean_difference': {
                    'value': round(mean_diff, 4),
                    'ci_95': (round(diff_ci[0], 4), round(diff_ci[1], 4))
                },
                'group_statistics': {
                    str(groups[0]): {
                        'n': len(group1_data),
                        'mean': round(group1_data.mean(), 4),
                        'std': round(group1_data.std(), 4),
                        'se': round(group1_data.std() / np.sqrt(len(group1_data)), 4)
                    },
                    str(groups[1]): {
                        'n': len(group2_data),
                        'mean': round(group2_data.mean(), 4),
                        'std': round(group2_data.std(), 4),
                        'se': round(group2_data.std() / np.sqrt(len(group2_data)), 4)
                    }
                },
                'assumptions': {
                    'normality_group1': {
                        'shapiro_w': round(normality_g1[0], 4) if normality_g1[0] else None,
                        'p_value': round(normality_g1[1], 4) if normality_g1[1] else None,
                        'normal': normality_g1[1] > self.alpha if normality_g1[1] else None
                    },
                    'normality_group2': {
                        'shapiro_w': round(normality_g2[0], 4) if normality_g2[0] else None,
                        'p_value': round(normality_g2[1], 4) if normality_g2[1] else None,
                        'normal': normality_g2[1] > self.alpha if normality_g2[1] else None
                    },
                    'equal_variance': {
                        'levene_stat': round(levene_stat, 4) if not paired else None,
                        'p_value': round(levene_p, 4) if not paired else None,
                        'equal': equal_var if not paired else None
                    }
                },
                'variables': {
                    'group': group_var,
                    'outcome': outcome_var,
                    'groups': [str(g) for g in groups]
                }
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def run_anova(self, df, group_var, outcome_var):
        """
        Run one-way ANOVA with post-hoc tests
        """
        try:
            df_clean = df[[group_var, outcome_var]].dropna()
            groups = df_clean[group_var].unique()
            
            if len(groups) < 3:
                return {'error': 'ANOVA requires 3 or more groups. Use t-test for 2 groups.'}
            
            # Prepare group data
            group_data = [df_clean[df_clean[group_var] == g][outcome_var].values for g in groups]
            
            # Run ANOVA
            f_stat, p_value = f_oneway(*group_data)
            
            # Effect size (Eta-squared)
            # SS_between / SS_total
            grand_mean = df_clean[outcome_var].mean()
            ss_between = sum(len(g) * (g.mean() - grand_mean)**2 for g in group_data)
            ss_total = sum((df_clean[outcome_var] - grand_mean)**2)
            eta_squared = ss_between / ss_total if ss_total > 0 else 0
            
            # Omega-squared (less biased)
            n_total = len(df_clean)
            k = len(groups)
            ms_within = (ss_total - ss_between) / (n_total - k)
            omega_squared = (ss_between - (k - 1) * ms_within) / (ss_total + ms_within)
            
            # Group statistics
            group_stats = {}
            for g in groups:
                g_data = df_clean[df_clean[group_var] == g][outcome_var]
                group_stats[str(g)] = {
                    'n': len(g_data),
                    'mean': round(g_data.mean(), 4),
                    'std': round(g_data.std(), 4),
                    'se': round(g_data.std() / np.sqrt(len(g_data)), 4)
                }
            
            # Post-hoc: Tukey HSD using statsmodels
            from statsmodels.stats.multicomp import pairwise_tukeyhsd
            tukey = pairwise_tukeyhsd(df_clean[outcome_var], df_clean[group_var], alpha=self.alpha)
            
            posthoc_results = []
            for i in range(len(tukey.summary().data) - 1):
                row = tukey.summary().data[i + 1]
                posthoc_results.append({
                    'group1': str(row[0]),
                    'group2': str(row[1]),
                    'mean_diff': round(float(row[2]), 4),
                    'p_adj': round(float(row[3]), 4),
                    'ci_lower': round(float(row[4]), 4),
                    'ci_upper': round(float(row[5]), 4),
                    'significant': bool(row[6])
                })
            
            # Assumption checks
            levene_stat, levene_p = levene(*group_data)
            
            return {
                'test_type': 'One-way ANOVA',
                'test_statistic': round(f_stat, 4),
                'degrees_of_freedom': {
                    'between': k - 1,
                    'within': n_total - k
                },
                'p_value': round(p_value, 4),
                'significant': p_value < self.alpha,
                'alpha': self.alpha,
                'effect_size': {
                    'eta_squared': round(eta_squared, 4),
                    'omega_squared': round(omega_squared, 4),
                    'interpretation': self._interpret_effect_size(eta_squared, 'eta_squared')
                },
                'group_statistics': group_stats,
                'posthoc': {
                    'method': 'Tukey HSD',
                    'comparisons': posthoc_results
                },
                'assumptions': {
                    'homogeneity_of_variance': {
                        'levene_stat': round(levene_stat, 4),
                        'p_value': round(levene_p, 4),
                        'equal': levene_p > self.alpha
                    }
                },
                'variables': {
                    'group': group_var,
                    'outcome': outcome_var,
                    'groups': [str(g) for g in groups]
                }
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def run_chisquare(self, df, var1, var2):
        """
        Run Chi-square test of independence (or Fisher's exact for small cells)
        """
        try:
            df_clean = df[[var1, var2]].dropna()
            
            # Create contingency table
            contingency_table = pd.crosstab(df_clean[var1], df_clean[var2])
            
            # Check if Fisher's exact is needed (any expected cell < 5)
            chi2, p_value, dof, expected = chi2_contingency(contingency_table)
            use_fisher = (expected < 5).any()
            
            if use_fisher and contingency_table.shape == (2, 2):
                # Fisher's exact test for 2x2 tables
                odds_ratio, p_value = fisher_exact(contingency_table)
                test_type = "Fisher's Exact Test"
            else:
                test_type = "Chi-square Test of Independence"
                odds_ratio = None
            
            # Effect size (Cramér's V)
            n = contingency_table.sum().sum()
            min_dim = min(contingency_table.shape[0] - 1, contingency_table.shape[1] - 1)
            cramers_v = np.sqrt(chi2 / (n * min_dim)) if min_dim > 0 else 0
            
            # Phi coefficient for 2x2 tables
            phi = np.sqrt(chi2 / n) if contingency_table.shape == (2, 2) else None
            
            return {
                'test_type': test_type,
                'test_statistic': round(chi2, 4),
                'degrees_of_freedom': dof,
                'p_value': round(p_value, 4),
                'significant': p_value < self.alpha,
                'alpha': self.alpha,
                'effect_size': {
                    'cramers_v': round(cramers_v, 4),
                    'phi': round(phi, 4) if phi else None,
                    'odds_ratio': round(odds_ratio, 4) if odds_ratio else None,
                    'interpretation': self._interpret_effect_size(cramers_v, 'cramers_v')
                },
                'contingency_table': {
                    'observed': contingency_table.to_dict(),
                    'expected': pd.DataFrame(expected, 
                                            index=contingency_table.index, 
                                            columns=contingency_table.columns).round(2).to_dict()
                },
                'sample_size': n,
                'assumptions': {
                    'expected_cell_counts': {
                        'min_expected': round(expected.min(), 2),
                        'cells_below_5': int((expected < 5).sum()),
                        'fisher_recommended': use_fisher
                    }
                },
                'variables': {
                    'variable1': var1,
                    'variable2': var2
                }
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def run_correlation(self, df, var1, var2, method='pearson'):
        """
        Run correlation analysis (Pearson or Spearman)
        """
        try:
            df_clean = df[[var1, var2]].dropna()
            x = df_clean[var1].values
            y = df_clean[var2].values
            
            n = len(x)
            
            if method == 'pearson':
                r, p_value = pearsonr(x, y)
                test_type = "Pearson Correlation"
            else:
                r, p_value = spearmanr(x, y)
                test_type = "Spearman Correlation"
            
            # Fisher's z transformation for CI
            z = np.arctanh(r)
            se = 1 / np.sqrt(n - 3)
            z_ci = (z - 1.96 * se, z + 1.96 * se)
            r_ci = (np.tanh(z_ci[0]), np.tanh(z_ci[1]))
            
            # R-squared
            r_squared = r ** 2
            
            # Strength interpretation
            abs_r = abs(r)
            if abs_r < 0.1:
                strength = 'negligible'
            elif abs_r < 0.3:
                strength = 'weak'
            elif abs_r < 0.5:
                strength = 'moderate'
            elif abs_r < 0.7:
                strength = 'strong'
            else:
                strength = 'very strong'
            
            direction = 'positive' if r > 0 else 'negative'
            
            return {
                'test_type': test_type,
                'correlation_coefficient': round(r, 4),
                'p_value': round(p_value, 4),
                'significant': p_value < self.alpha,
                'alpha': self.alpha,
                'r_squared': round(r_squared, 4),
                'confidence_interval': {
                    'ci_95': (round(r_ci[0], 4), round(r_ci[1], 4))
                },
                'interpretation': {
                    'strength': strength,
                    'direction': direction,
                    'effect_size': self._interpret_effect_size(r, 'r')
                },
                'sample_size': n,
                'variables': {
                    'variable1': var1,
                    'variable2': var2
                }
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def run_linear_regression(self, df, outcome, predictors):
        """
        Run linear regression (simple or multiple)
        """
        try:
            # Ensure predictors is a list
            if isinstance(predictors, str):
                predictors = [predictors]
            
            # Clean data
            all_vars = [outcome] + predictors
            df_clean = df[all_vars].dropna()
            
            # Prepare data
            X = df_clean[predictors]
            y = df_clean[outcome]
            
            # Add constant for intercept
            X_const = sm.add_constant(X)
            
            # Fit model
            model = sm.OLS(y, X_const).fit()
            
            # Extract results
            coefficients = []
            for i, var in enumerate(['const'] + predictors):
                coef = model.params[i]
                se = model.bse[i]
                t_val = model.tvalues[i]
                p_val = model.pvalues[i]
                ci = model.conf_int().iloc[i]
                
                # Standardized coefficient (beta) - only for predictors, not constant
                if var == 'const':
                    beta = None
                else:
                    beta = coef * (X[var].std() / y.std())
                
                coefficients.append({
                    'variable': var,
                    'B': round(coef, 4),
                    'SE': round(se, 4),
                    'beta': round(beta, 4) if beta is not None else None,
                    't': round(t_val, 4),
                    'p': round(p_val, 4),
                    'ci_95': (round(ci[0], 4), round(ci[1], 4)),
                    'significant': p_val < self.alpha
                })
            
            # VIF for multicollinearity
            vif_data = []
            if len(predictors) > 1:
                for i, var in enumerate(predictors):
                    vif = variance_inflation_factor(X.values, i)
                    vif_data.append({
                        'variable': var,
                        'VIF': round(vif, 4),
                        'concern': vif > 5,
                        'severe': vif > 10
                    })
            
            # Residual diagnostics
            residuals = model.resid
            fitted = model.fittedvalues
            
            # Normality of residuals
            shapiro_stat, shapiro_p = shapiro(residuals) if len(residuals) <= 5000 else (None, None)
            
            # Heteroscedasticity (Breusch-Pagan)
            bp_stat, bp_p, _, _ = het_breuschpagan(residuals, X_const)
            
            # Durbin-Watson for autocorrelation
            dw = durbin_watson(residuals)
            
            return {
                'test_type': 'Multiple Linear Regression' if len(predictors) > 1 else 'Simple Linear Regression',
                'model_summary': {
                    'r_squared': round(model.rsquared, 4),
                    'r_squared_adj': round(model.rsquared_adj, 4),
                    'f_statistic': round(model.fvalue, 4),
                    'f_pvalue': round(model.f_pvalue, 4),
                    'significant': model.f_pvalue < self.alpha,
                    'aic': round(model.aic, 4),
                    'bic': round(model.bic, 4)
                },
                'coefficients': coefficients,
                'sample_size': len(df_clean),
                'effect_size': {
                    'r_squared': round(model.rsquared, 4),
                    'interpretation': self._interpret_effect_size(model.rsquared, 'r_squared')
                },
                'multicollinearity': vif_data if vif_data else None,
                'assumptions': {
                    'normality_of_residuals': {
                        'shapiro_w': round(shapiro_stat, 4) if shapiro_stat else None,
                        'p_value': round(shapiro_p, 4) if shapiro_p else None,
                        'normal': shapiro_p > self.alpha if shapiro_p else None
                    },
                    'homoscedasticity': {
                        'breusch_pagan_stat': round(bp_stat, 4),
                        'p_value': round(bp_p, 4),
                        'homoscedastic': bp_p > self.alpha
                    },
                    'independence': {
                        'durbin_watson': round(dw, 4),
                        'interpretation': 'positive autocorrelation' if dw < 1.5 else ('negative autocorrelation' if dw > 2.5 else 'no autocorrelation')
                    }
                },
                'variables': {
                    'outcome': outcome,
                    'predictors': predictors
                }
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def run_logistic_regression(self, df, outcome, predictors):
        """
        Run binary logistic regression
        """
        try:
            # Ensure predictors is a list
            if isinstance(predictors, str):
                predictors = [predictors]
            
            # Clean data
            all_vars = [outcome] + predictors
            df_clean = df[all_vars].dropna()
            
            # Verify binary outcome
            unique_vals = df_clean[outcome].unique()
            if len(unique_vals) != 2:
                return {'error': f'Logistic regression requires binary outcome. Found {len(unique_vals)} unique values.'}
            
            # Prepare data
            X = df_clean[predictors]
            y = df_clean[outcome]
            
            # Encode outcome if needed
            if y.dtype == 'object':
                y = pd.Categorical(y).codes
            
            # Add constant
            X_const = sm.add_constant(X)
            
            # Fit model
            model = sm.Logit(y, X_const).fit(disp=0)
            
            # Extract results
            coefficients = []
            for i, var in enumerate(['const'] + predictors):
                coef = model.params[i]
                se = model.bse[i]
                z_val = model.tvalues[i]
                p_val = model.pvalues[i]
                ci = model.conf_int().iloc[i]
                
                # Odds ratio
                odds_ratio = np.exp(coef)
                or_ci = (np.exp(ci[0]), np.exp(ci[1]))
                
                coefficients.append({
                    'variable': var,
                    'B': round(coef, 4),
                    'SE': round(se, 4),
                    'Wald': round(z_val ** 2, 4),
                    'z': round(z_val, 4),
                    'p': round(p_val, 4),
                    'OR': round(odds_ratio, 4),
                    'OR_ci_95': (round(or_ci[0], 4), round(or_ci[1], 4)),
                    'significant': p_val < self.alpha
                })
            
            # Model fit statistics
            # McFadden's pseudo R-squared
            pseudo_r2 = model.prsquared
            
            # Prediction accuracy
            predicted = (model.predict(X_const) > 0.5).astype(int)
            accuracy = (predicted == y).mean()
            
            # Confusion matrix
            from sklearn.metrics import confusion_matrix, classification_report
            cm = confusion_matrix(y, predicted)
            
            return {
                'test_type': 'Binary Logistic Regression',
                'model_summary': {
                    'pseudo_r_squared': round(pseudo_r2, 4),
                    'log_likelihood': round(model.llf, 4),
                    'aic': round(model.aic, 4),
                    'bic': round(model.bic, 4),
                    'llr_pvalue': round(model.llr_pvalue, 4),
                    'significant': model.llr_pvalue < self.alpha
                },
                'coefficients': coefficients,
                'sample_size': len(df_clean),
                'classification': {
                    'accuracy': round(accuracy, 4),
                    'confusion_matrix': cm.tolist()
                },
                'effect_size': {
                    'pseudo_r_squared': round(pseudo_r2, 4),
                    'interpretation': 'excellent' if pseudo_r2 > 0.4 else ('good' if pseudo_r2 > 0.2 else 'acceptable')
                },
                'variables': {
                    'outcome': outcome,
                    'predictors': predictors
                }
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def run_mannwhitney(self, df, group_var, outcome_var):
        """
        Mann-Whitney U test (non-parametric alternative to independent t-test)
        """
        try:
            df_clean = df[[group_var, outcome_var]].dropna()
            groups = df_clean[group_var].unique()
            
            if len(groups) != 2:
                return {'error': f'Mann-Whitney U requires exactly 2 groups, found {len(groups)}'}
            
            group1_data = df_clean[df_clean[group_var] == groups[0]][outcome_var]
            group2_data = df_clean[df_clean[group_var] == groups[1]][outcome_var]
            
            # Run Mann-Whitney U
            u_stat, p_value = mannwhitneyu(group1_data, group2_data, alternative='two-sided')
            
            # Effect size (rank-biserial correlation)
            n1, n2 = len(group1_data), len(group2_data)
            r = 1 - (2 * u_stat) / (n1 * n2)
            
            return {
                'test_type': 'Mann-Whitney U Test',
                'test_statistic': round(u_stat, 4),
                'p_value': round(p_value, 4),
                'significant': p_value < self.alpha,
                'alpha': self.alpha,
                'effect_size': {
                    'rank_biserial_r': round(r, 4),
                    'interpretation': self._interpret_effect_size(r, 'r')
                },
                'group_statistics': {
                    str(groups[0]): {
                        'n': n1,
                        'median': round(group1_data.median(), 4),
                        'iqr': round(group1_data.quantile(0.75) - group1_data.quantile(0.25), 4)
                    },
                    str(groups[1]): {
                        'n': n2,
                        'median': round(group2_data.median(), 4),
                        'iqr': round(group2_data.quantile(0.75) - group2_data.quantile(0.25), 4)
                    }
                },
                'variables': {
                    'group': group_var,
                    'outcome': outcome_var,
                    'groups': [str(g) for g in groups]
                }
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def run_kruskal(self, df, group_var, outcome_var):
        """
        Kruskal-Wallis H test (non-parametric alternative to ANOVA)
        """
        try:
            df_clean = df[[group_var, outcome_var]].dropna()
            groups = df_clean[group_var].unique()
            
            if len(groups) < 3:
                return {'error': 'Kruskal-Wallis requires 3 or more groups. Use Mann-Whitney U for 2 groups.'}
            
            # Prepare group data
            group_data = [df_clean[df_clean[group_var] == g][outcome_var].values for g in groups]
            
            # Run Kruskal-Wallis
            h_stat, p_value = kruskal(*group_data)
            
            # Effect size (epsilon-squared)
            n = len(df_clean)
            k = len(groups)
            epsilon_sq = h_stat / (n - 1)
            
            # Group statistics
            group_stats = {}
            for g in groups:
                g_data = df_clean[df_clean[group_var] == g][outcome_var]
                group_stats[str(g)] = {
                    'n': len(g_data),
                    'median': round(g_data.median(), 4),
                    'iqr': round(g_data.quantile(0.75) - g_data.quantile(0.25), 4)
                }
            
            return {
                'test_type': 'Kruskal-Wallis H Test',
                'test_statistic': round(h_stat, 4),
                'degrees_of_freedom': k - 1,
                'p_value': round(p_value, 4),
                'significant': p_value < self.alpha,
                'alpha': self.alpha,
                'effect_size': {
                    'epsilon_squared': round(epsilon_sq, 4),
                    'interpretation': self._interpret_effect_size(epsilon_sq, 'eta_squared')
                },
                'group_statistics': group_stats,
                'variables': {
                    'group': group_var,
                    'outcome': outcome_var,
                    'groups': [str(g) for g in groups]
                }
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def get_descriptive_stats(self, df, variables=None, groupby=None):
        """
        Generate comprehensive descriptive statistics
        """
        try:
            if variables is None:
                variables = df.columns.tolist()
            
            results = {'continuous': {}, 'categorical': {}}
            
            for var in variables:
                if var not in df.columns:
                    continue
                
                col = df[var]
                
                # Determine variable type
                if pd.api.types.is_numeric_dtype(col) and col.nunique() > 10:
                    # Continuous variable
                    stats_dict = {
                        'n': int(col.count()),
                        'missing': int(col.isna().sum()),
                        'missing_pct': round(col.isna().mean() * 100, 2),
                        'mean': round(col.mean(), 4),
                        'std': round(col.std(), 4),
                        'median': round(col.median(), 4),
                        'q1': round(col.quantile(0.25), 4),
                        'q3': round(col.quantile(0.75), 4),
                        'iqr': round(col.quantile(0.75) - col.quantile(0.25), 4),
                        'min': round(col.min(), 4),
                        'max': round(col.max(), 4),
                        'skewness': round(col.skew(), 4),
                        'kurtosis': round(col.kurtosis(), 4)
                    }
                    
                    # Distribution flags
                    stats_dict['distribution'] = {
                        'skewed': abs(col.skew()) > 1,
                        'direction': 'right' if col.skew() > 0 else 'left',
                        'use_nonparametric': abs(col.skew()) > 1
                    }
                    
                    results['continuous'][var] = stats_dict
                else:
                    # Categorical variable
                    freq = col.value_counts()
                    pct = col.value_counts(normalize=True) * 100
                    
                    categories = []
                    for cat in freq.index:
                        categories.append({
                            'category': str(cat),
                            'n': int(freq[cat]),
                            'percentage': round(pct[cat], 2)
                        })
                    
                    results['categorical'][var] = {
                        'n': int(col.count()),
                        'missing': int(col.isna().sum()),
                        'missing_pct': round(col.isna().mean() * 100, 2),
                        'unique_values': int(col.nunique()),
                        'categories': categories,
                        'sparse_categories': [c['category'] for c in categories if c['n'] < 5]
                    }
            
            return results
            
        except Exception as e:
            return {'error': str(e)}

