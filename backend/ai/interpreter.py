"""
AI Interpreter Module
Sends Python's statistical results to DeepSeek R1 for interpretation
"""
import os
import json
import requests
from typing import Dict, Any, Optional
from .prompts import (
    INTERPRETATION_SYSTEM_PROMPT,
    INTERPRETATION_MESSAGE_TEMPLATE,
    INTERPRETATION_PROMPTS,
    DESCRIPTIVE_NARRATIVE_PROMPT,
    QUALITATIVE_PROMPTS,
    MIXED_METHODS_PROMPT,
    METHODS_NARRATIVE_PROMPT
)


class AIInterpreter:
    """
    Interprets statistical results using DeepSeek R1 Reasoner
    Fallback to Gemini if DeepSeek is unavailable
    """
    
    def __init__(self):
        self.deepseek_api_key = os.getenv('DEEPSEEK_API_KEY', '')
        self.gemini_api_key = os.getenv('GEMINI_API_KEY', '')
        self.deepseek_base_url = 'https://api.deepseek.com/v1'
        self.gemini_base_url = 'https://generativelanguage.googleapis.com/v1beta'
        
    def _call_deepseek(self, messages: list, max_tokens: int = 2000) -> Optional[str]:
        """Call DeepSeek API"""
        if not self.deepseek_api_key:
            return None
            
        try:
            response = requests.post(
                f'{self.deepseek_base_url}/chat/completions',
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.deepseek_api_key}'
                },
                json={
                    'model': 'deepseek-reasoner',
                    'messages': messages,
                    'max_tokens': max_tokens,
                    'temperature': 0.7,
                    'stream': False
                },
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                return data['choices'][0]['message']['content']
            else:
                print(f"DeepSeek API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"DeepSeek API exception: {e}")
            return None
    
    def _call_gemini(self, prompt: str, max_tokens: int = 2000) -> Optional[str]:
        """Call Gemini API as fallback"""
        if not self.gemini_api_key:
            return None
            
        try:
            # Try gemini-3-flash-preview first, then gemini-2.5-flash
            models = ['gemini-3-flash-preview', 'gemini-2.5-flash']
            
            for model in models:
                try:
                    response = requests.post(
                        f'{self.gemini_base_url}/models/{model}:generateContent?key={self.gemini_api_key}',
                        headers={'Content-Type': 'application/json'},
                        json={
                            'contents': [{'parts': [{'text': prompt}]}],
                            'generationConfig': {
                                'temperature': 0.7,
                                'maxOutputTokens': max_tokens
                            }
                        },
                        timeout=60
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        return data['candidates'][0]['content']['parts'][0]['text']
                except:
                    continue
            
            return None
                
        except Exception as e:
            print(f"Gemini API exception: {e}")
            return None
    
    def interpret(self, prompt: str, use_system_prompt: bool = True) -> Dict[str, Any]:
        """
        Send prompt to AI and get interpretation
        """
        messages = []
        
        if use_system_prompt:
            messages.append({
                'role': 'system',
                'content': INTERPRETATION_SYSTEM_PROMPT
            })
        
        messages.append({
            'role': 'user',
            'content': prompt
        })
        
        # Try DeepSeek first
        result = self._call_deepseek(messages)
        
        if result:
            return {
                'success': True,
                'interpretation': result,
                'model': 'deepseek-reasoner'
            }
        
        # Fallback to Gemini
        full_prompt = INTERPRETATION_SYSTEM_PROMPT + "\n\n" + prompt if use_system_prompt else prompt
        result = self._call_gemini(full_prompt)
        
        if result:
            return {
                'success': True,
                'interpretation': result,
                'model': 'gemini-flash'
            }
        
        # Both failed - return template response
        return {
            'success': False,
            'interpretation': self._generate_fallback_interpretation(),
            'model': 'fallback-template',
            'error': 'Both AI services unavailable. Using template response.'
        }
    
    def _generate_fallback_interpretation(self) -> str:
        """Generate a template response when AI is unavailable"""
        return """
**Interpretation (AI temporarily unavailable):**

The statistical results have been calculated accurately by Python. Please review:
- The p-value to determine statistical significance (p < 0.05 is significant)
- The effect size to understand practical significance
- The confidence intervals for precision of estimates

For a complete narrative interpretation, please retry when AI services are available.
"""
    
    def interpret_ttest(self, results: Dict, objective: str) -> Dict[str, Any]:
        """Interpret t-test results"""
        if 'error' in results:
            return {'error': results['error']}
        
        # Build prompt from template
        groups = results['variables']['groups']
        group_stats = results['group_statistics']
        
        prompt = INTERPRETATION_PROMPTS['ttest'].format(
            test_type=results['test_type'],
            group1=groups[0],
            n1=group_stats[groups[0]]['n'],
            mean1=group_stats[groups[0]]['mean'],
            sd1=group_stats[groups[0]]['std'],
            group2=groups[1],
            n2=group_stats[groups[1]]['n'],
            mean2=group_stats[groups[1]]['mean'],
            sd2=group_stats[groups[1]]['std'],
            df=results['degrees_of_freedom'],
            t_stat=results['test_statistic'],
            p_value=results['p_value'],
            cohens_d=results['effect_size']['cohens_d'],
            ci_lower=results['effect_size']['ci_95'][0],
            ci_upper=results['effect_size']['ci_95'][1],
            effect_interpretation=results['effect_size']['interpretation'],
            objective=objective
        )
        
        return self.interpret(prompt)
    
    def interpret_anova(self, results: Dict, objective: str) -> Dict[str, Any]:
        """Interpret ANOVA results"""
        if 'error' in results:
            return {'error': results['error']}
        
        # Format group means
        group_means = "\n".join([
            f"- {g}: M = {s['mean']}, SD = {s['std']}, n = {s['n']}"
            for g, s in results['group_statistics'].items()
        ])
        
        # Format post-hoc results
        posthoc = "\n".join([
            f"- {c['group1']} vs {c['group2']}: p = {c['p_adj']} {'(significant)' if c['significant'] else ''}"
            for c in results['posthoc']['comparisons']
        ])
        
        prompt = INTERPRETATION_PROMPTS['anova'].format(
            groups=", ".join(results['variables']['groups']),
            df_between=results['degrees_of_freedom']['between'],
            df_within=results['degrees_of_freedom']['within'],
            f_stat=results['test_statistic'],
            p_value=results['p_value'],
            eta_squared=results['effect_size']['eta_squared'],
            effect_interpretation=results['effect_size']['interpretation'],
            group_means=group_means,
            posthoc=posthoc,
            objective=objective
        )
        
        return self.interpret(prompt)
    
    def interpret_chisquare(self, results: Dict, objective: str) -> Dict[str, Any]:
        """Interpret chi-square results"""
        if 'error' in results:
            return {'error': results['error']}
        
        prompt = INTERPRETATION_PROMPTS['chisquare'].format(
            test_type=results['test_type'],
            df=results['degrees_of_freedom'],
            chi_stat=results['test_statistic'],
            p_value=results['p_value'],
            cramers_v=results['effect_size']['cramers_v'],
            effect_interpretation=results['effect_size']['interpretation'],
            sample_size=results['sample_size'],
            contingency_table=json.dumps(results['contingency_table']['observed'], indent=2),
            objective=objective
        )
        
        return self.interpret(prompt)
    
    def interpret_correlation(self, results: Dict, objective: str) -> Dict[str, Any]:
        """Interpret correlation results"""
        if 'error' in results:
            return {'error': results['error']}
        
        prompt = INTERPRETATION_PROMPTS['correlation'].format(
            test_type=results['test_type'],
            var1=results['variables']['variable1'],
            var2=results['variables']['variable2'],
            r=results['correlation_coefficient'],
            p_value=results['p_value'],
            ci_lower=results['confidence_interval']['ci_95'][0],
            ci_upper=results['confidence_interval']['ci_95'][1],
            r_squared=results['r_squared'],
            strength=results['interpretation']['strength'],
            direction=results['interpretation']['direction'],
            objective=objective
        )
        
        return self.interpret(prompt)
    
    def interpret_linear_regression(self, results: Dict, objective: str) -> Dict[str, Any]:
        """Interpret linear regression results"""
        if 'error' in results:
            return {'error': results['error']}
        
        # Format coefficients table
        coef_lines = []
        for c in results['coefficients']:
            sig = "*" if c['significant'] else ""
            coef_lines.append(
                f"- {c['variable']}: B = {c['B']}, SE = {c['SE']}, β = {c['beta'] or 'N/A'}, "
                f"t = {c['t']}, p = {c['p']}{sig}"
            )
        
        prompt = INTERPRETATION_PROMPTS['regression_linear'].format(
            outcome=results['variables']['outcome'],
            predictors=", ".join(results['variables']['predictors']),
            r_squared=results['model_summary']['r_squared'],
            r_squared_adj=results['model_summary']['r_squared_adj'],
            df1=len(results['coefficients']) - 1,
            df2=results['sample_size'] - len(results['coefficients']),
            f_stat=results['model_summary']['f_statistic'],
            f_p=results['model_summary']['f_pvalue'],
            sample_size=results['sample_size'],
            coefficients_table="\n".join(coef_lines),
            objective=objective
        )
        
        return self.interpret(prompt)
    
    def interpret_logistic_regression(self, results: Dict, objective: str) -> Dict[str, Any]:
        """Interpret logistic regression results"""
        if 'error' in results:
            return {'error': results['error']}
        
        # Format coefficients table
        coef_lines = []
        for c in results['coefficients']:
            sig = "*" if c['significant'] else ""
            coef_lines.append(
                f"- {c['variable']}: OR = {c['OR']} [{c['OR_ci_95'][0]}, {c['OR_ci_95'][1]}], "
                f"p = {c['p']}{sig}"
            )
        
        prompt = INTERPRETATION_PROMPTS['regression_logistic'].format(
            outcome=results['variables']['outcome'],
            predictors=", ".join(results['variables']['predictors']),
            pseudo_r2=results['model_summary']['pseudo_r_squared'],
            model_p=results['model_summary']['llr_pvalue'],
            accuracy=round(results['classification']['accuracy'] * 100, 1),
            sample_size=results['sample_size'],
            coefficients_table="\n".join(coef_lines),
            objective=objective
        )
        
        return self.interpret(prompt)
    
    def generate_descriptive_narrative(self, stats: Dict, sample_size: int) -> Dict[str, Any]:
        """Generate narrative for descriptive statistics"""
        # Format continuous variables
        cont_lines = []
        if 'continuous' in stats:
            for var, s in stats['continuous'].items():
                cont_lines.append(f"- {var}: M = {s['mean']}, SD = {s['std']}, range = {s['min']}-{s['max']}")
        
        # Format categorical variables
        cat_lines = []
        if 'categorical' in stats:
            for var, s in stats['categorical'].items():
                cats = ", ".join([f"{c['category']} ({c['percentage']}%)" for c in s['categories'][:5]])
                cat_lines.append(f"- {var}: {cats}")
        
        prompt = DESCRIPTIVE_NARRATIVE_PROMPT.format(
            n=sample_size,
            continuous_stats="\n".join(cont_lines) if cont_lines else "None",
            categorical_stats="\n".join(cat_lines) if cat_lines else "None"
        )
        
        return self.interpret(prompt, use_system_prompt=False)
    
    def generate_methods_narrative(self, tests_used: list, variables: list) -> Dict[str, Any]:
        """Generate methods section for Chapter 3"""
        prompt = METHODS_NARRATIVE_PROMPT.format(
            tests_used=", ".join(tests_used),
            variables=", ".join(variables)
        )
        
        return self.interpret(prompt, use_system_prompt=False)

