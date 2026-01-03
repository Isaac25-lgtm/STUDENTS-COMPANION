"""
APA Table Generator Module
Creates properly formatted tables ready for academic documents
"""
import pandas as pd
import numpy as np


class APATableGenerator:
    """
    Generate APA-formatted tables for thesis/dissertation
    """
    
    def __init__(self):
        self.table_number = 0
    
    def _format_p_value(self, p):
        """Format p-value according to APA style"""
        if p < 0.001:
            return '< .001'
        elif p < 0.01:
            return f'{p:.3f}'[1:]  # Remove leading 0
        else:
            return f'{p:.3f}'[1:]
    
    def _format_number(self, n, decimals=2):
        """Format number with specified decimal places"""
        if pd.isna(n):
            return '—'
        return f'{n:.{decimals}f}'
    
    def generate_table1_characteristics(self, descriptive_stats, groupby=None, title=None):
        """
        Generate Table 1: Sample Characteristics (Baseline Table)
        
        Format:
        | Characteristic | Total (N=X) | Group 1 (n=X) | Group 2 (n=X) | p-value |
        """
        rows = []
        
        # Continuous variables
        if 'continuous' in descriptive_stats:
            for var, stats in descriptive_stats['continuous'].items():
                row = {
                    'Characteristic': var,
                    'Total (N)': f"{stats['mean']:.2f} ({stats['std']:.2f})"
                }
                rows.append(row)
        
        # Categorical variables
        if 'categorical' in descriptive_stats:
            for var, stats in descriptive_stats['categorical'].items():
                for cat in stats['categories']:
                    row = {
                        'Characteristic': f"  {cat['category']}",
                        'Total (N)': f"{cat['n']} ({cat['percentage']:.1f}%)"
                    }
                    rows.append(row)
        
        df = pd.DataFrame(rows)
        
        # Format as markdown table
        table_md = self._df_to_markdown(df, title or 'Table 1\nSample Characteristics')
        
        return {
            'dataframe': df.to_dict('records'),
            'markdown': table_md,
            'apa_note': 'Note. Continuous variables presented as Mean (SD); categorical variables as n (%).'
        }
    
    def generate_ttest_table(self, ttest_results, title=None):
        """
        Generate APA table for t-test results
        """
        if 'error' in ttest_results:
            return {'error': ttest_results['error']}
        
        group_stats = ttest_results['group_statistics']
        groups = list(group_stats.keys())
        
        rows = [{
            'Variable': ttest_results['variables']['outcome'],
            f'{groups[0]} M (SD)': f"{group_stats[groups[0]]['mean']:.2f} ({group_stats[groups[0]]['std']:.2f})",
            f'{groups[1]} M (SD)': f"{group_stats[groups[1]]['mean']:.2f} ({group_stats[groups[1]]['std']:.2f})",
            't': f"{ttest_results['test_statistic']:.2f}",
            'df': str(ttest_results['degrees_of_freedom']),
            'p': self._format_p_value(ttest_results['p_value']),
            "Cohen's d [95% CI]": f"{ttest_results['effect_size']['cohens_d']:.2f} [{ttest_results['effect_size']['ci_95'][0]:.2f}, {ttest_results['effect_size']['ci_95'][1]:.2f}]"
        }]
        
        df = pd.DataFrame(rows)
        table_md = self._df_to_markdown(df, title or f"Table\nIndependent Samples t-test Results for {ttest_results['variables']['outcome']}")
        
        return {
            'dataframe': df.to_dict('records'),
            'markdown': table_md,
            'apa_note': f"Note. N = {group_stats[groups[0]]['n'] + group_stats[groups[1]]['n']}. " +
                       f"Effect size interpretation: {ttest_results['effect_size']['interpretation']}."
        }
    
    def generate_anova_table(self, anova_results, title=None):
        """
        Generate APA table for ANOVA results
        """
        if 'error' in anova_results:
            return {'error': anova_results['error']}
        
        # Main ANOVA table
        rows = [{
            'Source': 'Between Groups',
            'df': str(anova_results['degrees_of_freedom']['between']),
            'F': f"{anova_results['test_statistic']:.2f}",
            'p': self._format_p_value(anova_results['p_value']),
            'η²': f"{anova_results['effect_size']['eta_squared']:.3f}"
        }, {
            'Source': 'Within Groups',
            'df': str(anova_results['degrees_of_freedom']['within']),
            'F': '—',
            'p': '—',
            'η²': '—'
        }]
        
        df = pd.DataFrame(rows)
        main_table = self._df_to_markdown(df, title or f"Table\nOne-Way ANOVA Results for {anova_results['variables']['outcome']}")
        
        # Post-hoc table
        posthoc_rows = []
        for comp in anova_results['posthoc']['comparisons']:
            posthoc_rows.append({
                'Comparison': f"{comp['group1']} vs {comp['group2']}",
                'Mean Diff': f"{comp['mean_diff']:.2f}",
                '95% CI': f"[{comp['ci_lower']:.2f}, {comp['ci_upper']:.2f}]",
                'p (adj)': self._format_p_value(comp['p_adj']),
                'Significant': 'Yes' if comp['significant'] else 'No'
            })
        
        posthoc_df = pd.DataFrame(posthoc_rows)
        posthoc_table = self._df_to_markdown(posthoc_df, "Post-Hoc Comparisons (Tukey HSD)")
        
        return {
            'main_table': {
                'dataframe': df.to_dict('records'),
                'markdown': main_table
            },
            'posthoc_table': {
                'dataframe': posthoc_df.to_dict('records'),
                'markdown': posthoc_table
            },
            'apa_note': f"Note. Effect size interpretation: {anova_results['effect_size']['interpretation']}. " +
                       f"Adjusted p-values use Tukey HSD correction."
        }
    
    def generate_chisquare_table(self, chi_results, title=None):
        """
        Generate APA table for Chi-square results
        """
        if 'error' in chi_results:
            return {'error': chi_results['error']}
        
        # Contingency table
        observed = pd.DataFrame(chi_results['contingency_table']['observed'])
        
        # Summary row
        summary = [{
            'Statistic': 'Chi-square (χ²)',
            'Value': f"{chi_results['test_statistic']:.2f}"
        }, {
            'Statistic': 'Degrees of freedom',
            'Value': str(chi_results['degrees_of_freedom'])
        }, {
            'Statistic': 'p-value',
            'Value': self._format_p_value(chi_results['p_value'])
        }, {
            'Statistic': "Cramér's V",
            'Value': f"{chi_results['effect_size']['cramers_v']:.3f}"
        }]
        
        if chi_results['effect_size']['phi'] is not None:
            summary.append({
                'Statistic': 'Phi (φ)',
                'Value': f"{chi_results['effect_size']['phi']:.3f}"
            })
        
        summary_df = pd.DataFrame(summary)
        
        return {
            'contingency_table': {
                'dataframe': observed.to_dict(),
                'markdown': self._df_to_markdown(observed, "Observed Frequencies")
            },
            'summary': {
                'dataframe': summary_df.to_dict('records'),
                'markdown': self._df_to_markdown(summary_df, title or "Chi-Square Test Results")
            },
            'apa_note': f"Note. N = {chi_results['sample_size']}. " +
                       f"Effect size interpretation: {chi_results['effect_size']['interpretation']}."
        }
    
    def generate_correlation_table(self, corr_results, title=None):
        """
        Generate APA table for correlation results
        """
        if 'error' in corr_results:
            return {'error': corr_results['error']}
        
        rows = [{
            'Variables': f"{corr_results['variables']['variable1']} & {corr_results['variables']['variable2']}",
            'r': f"{corr_results['correlation_coefficient']:.3f}",
            '95% CI': f"[{corr_results['confidence_interval']['ci_95'][0]:.3f}, {corr_results['confidence_interval']['ci_95'][1]:.3f}]",
            'r²': f"{corr_results['r_squared']:.3f}",
            'p': self._format_p_value(corr_results['p_value'])
        }]
        
        df = pd.DataFrame(rows)
        table_md = self._df_to_markdown(df, title or f"Table\n{corr_results['test_type']} Results")
        
        return {
            'dataframe': df.to_dict('records'),
            'markdown': table_md,
            'apa_note': f"Note. N = {corr_results['sample_size']}. " +
                       f"Correlation strength: {corr_results['interpretation']['strength']} {corr_results['interpretation']['direction']}."
        }
    
    def generate_regression_table(self, reg_results, title=None):
        """
        Generate APA table for linear regression results
        """
        if 'error' in reg_results:
            return {'error': reg_results['error']}
        
        # Coefficients table
        rows = []
        for coef in reg_results['coefficients']:
            row = {
                'Variable': coef['variable'] if coef['variable'] != 'const' else '(Constant)',
                'B': f"{coef['B']:.3f}",
                'SE': f"{coef['SE']:.3f}",
                'β': f"{coef['beta']:.3f}" if coef['beta'] is not None else '—',
                't': f"{coef['t']:.2f}",
                'p': self._format_p_value(coef['p']),
                '95% CI': f"[{coef['ci_95'][0]:.3f}, {coef['ci_95'][1]:.3f}]"
            }
            rows.append(row)
        
        coef_df = pd.DataFrame(rows)
        coef_table = self._df_to_markdown(coef_df, title or f"Table\nLinear Regression Results: {reg_results['variables']['outcome']}")
        
        # Model summary
        model = reg_results['model_summary']
        model_summary = f"R² = {model['r_squared']:.3f}, Adjusted R² = {model['r_squared_adj']:.3f}, " + \
                       f"F({len(reg_results['coefficients'])-1}, {reg_results['sample_size']-len(reg_results['coefficients'])}) = {model['f_statistic']:.2f}, " + \
                       f"p {self._format_p_value(model['f_pvalue'])}"
        
        return {
            'coefficients': {
                'dataframe': coef_df.to_dict('records'),
                'markdown': coef_table
            },
            'model_summary': model_summary,
            'apa_note': f"Note. N = {reg_results['sample_size']}. " +
                       f"Effect size interpretation: {reg_results['effect_size']['interpretation']}.",
            'vif': reg_results.get('multicollinearity')
        }
    
    def generate_logistic_regression_table(self, log_results, title=None):
        """
        Generate APA table for logistic regression results
        """
        if 'error' in log_results:
            return {'error': log_results['error']}
        
        # Coefficients table
        rows = []
        for coef in log_results['coefficients']:
            row = {
                'Variable': coef['variable'] if coef['variable'] != 'const' else '(Constant)',
                'B': f"{coef['B']:.3f}",
                'SE': f"{coef['SE']:.3f}",
                'Wald': f"{coef['Wald']:.2f}",
                'p': self._format_p_value(coef['p']),
                'OR': f"{coef['OR']:.2f}",
                '95% CI OR': f"[{coef['OR_ci_95'][0]:.2f}, {coef['OR_ci_95'][1]:.2f}]"
            }
            rows.append(row)
        
        coef_df = pd.DataFrame(rows)
        coef_table = self._df_to_markdown(coef_df, title or f"Table\nLogistic Regression Results: {log_results['variables']['outcome']}")
        
        # Model summary
        model = log_results['model_summary']
        model_summary = f"Nagelkerke R² = {model['pseudo_r_squared']:.3f}, " + \
                       f"Model χ² p {self._format_p_value(model['llr_pvalue'])}, " + \
                       f"Classification accuracy = {log_results['classification']['accuracy']*100:.1f}%"
        
        return {
            'coefficients': {
                'dataframe': coef_df.to_dict('records'),
                'markdown': coef_table
            },
            'model_summary': model_summary,
            'apa_note': f"Note. N = {log_results['sample_size']}. OR = Odds Ratio. " +
                       f"Model fit: {log_results['effect_size']['interpretation']}."
        }
    
    def _df_to_markdown(self, df, title=None):
        """Convert DataFrame to APA-style markdown table"""
        lines = []
        
        if title:
            lines.append(f"**{title}**\n")
        
        # Header
        header = '| ' + ' | '.join(str(c) for c in df.columns) + ' |'
        separator = '|' + '|'.join(['---' for _ in df.columns]) + '|'
        lines.extend([header, separator])
        
        # Rows
        for _, row in df.iterrows():
            line = '| ' + ' | '.join(str(v) for v in row.values) + ' |'
            lines.append(line)
        
        return '\n'.join(lines)
    
    def generate_correlation_matrix(self, df, variables, title=None):
        """
        Generate correlation matrix table
        """
        try:
            corr_df = df[variables].corr().round(3)
            
            # Format lower triangle only (APA style)
            formatted = corr_df.copy()
            for i in range(len(variables)):
                for j in range(len(variables)):
                    if i <= j:
                        formatted.iloc[i, j] = '—' if i == j else ''
            
            return {
                'dataframe': corr_df.to_dict(),
                'formatted': formatted.to_dict(),
                'markdown': self._df_to_markdown(corr_df, title or "Correlation Matrix")
            }
            
        except Exception as e:
            return {'error': str(e)}

