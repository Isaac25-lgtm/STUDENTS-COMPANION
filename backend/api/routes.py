"""
API Routes for Data Analysis Lab
Flask REST API endpoints
"""
import os
import json
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename

# Import our modules
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from analysis.statistics import StatisticalAnalyzer
from analysis.assumptions import AssumptionChecker
from analysis.tables import APATableGenerator
from cleaning.quality import DataQualityChecker
from cleaning.transformations import DataTransformer
from cleaning.audit import AuditLogger, DataVersionManager
from ai.interpreter import AIInterpreter
from utils.file_handlers import FileHandler, DataStorage
from utils.formatters import ResultFormatter, PythonCodeGenerator

# Create blueprint
api_bp = Blueprint('api', __name__)

# Initialize modules
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
file_handler = FileHandler(UPLOAD_FOLDER)
data_storage = DataStorage()
analyzer = StatisticalAnalyzer()
assumption_checker = AssumptionChecker()
table_generator = APATableGenerator()
quality_checker = DataQualityChecker()
ai_interpreter = AIInterpreter()

# Store audit loggers per dataset
audit_loggers = {}


# ============================================================================
# DATA IMPORT ENDPOINTS
# ============================================================================

@api_bp.route('/analysis/import', methods=['POST'])
def import_data():
    """
    Import data file (CSV, Excel, or SPSS)
    """
    if 'file' not in request.files:
        return jsonify(ResultFormatter.format_error_response('No file provided')), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify(ResultFormatter.format_error_response('No file selected')), 400
    
    if not file_handler.allowed_file(file.filename):
        return jsonify(ResultFormatter.format_error_response(
            f'File type not allowed. Supported: {", ".join(file_handler.ALLOWED_EXTENSIONS)}'
        )), 400
    
    try:
        # Save file
        filepath, filename = file_handler.save_file(file)
        
        # Import data
        result = file_handler.import_file(filepath)
        
        if 'error' in result:
            return jsonify(ResultFormatter.format_error_response(result['error'])), 400
        
        df = result['data']
        
        # Store dataset
        dataset_id = data_storage.store(df, name=filename, version='v1_raw')
        
        # Create audit logger for this dataset
        audit_loggers[dataset_id] = AuditLogger(dataset_id)
        audit_loggers[dataset_id].log('import', {
            'filename': filename,
            'file_type': result['file_type'],
            'rows': len(df),
            'columns': len(df.columns)
        })
        
        # Generate data dictionary
        data_dict = quality_checker.generate_data_dictionary(df)
        
        # Get preview
        preview = file_handler.get_preview(df)
        
        return jsonify(ResultFormatter.format_success_response({
            'dataset_id': dataset_id,
            'filename': filename,
            'preview': preview,
            'data_dictionary': data_dict,
            'metadata': result['metadata']
        }, message='Data imported successfully'))
        
    except Exception as e:
        return jsonify(ResultFormatter.format_error_response(str(e))), 500


@api_bp.route('/analysis/datasets', methods=['GET'])
def list_datasets():
    """List all stored datasets"""
    datasets = data_storage.list_datasets()
    return jsonify(ResultFormatter.format_success_response(datasets))


# ============================================================================
# DATA CLEANING ENDPOINTS
# ============================================================================

@api_bp.route('/analysis/quality-check', methods=['POST'])
def quality_check():
    """
    Run comprehensive data quality check
    """
    data = request.get_json()
    dataset_id = data.get('dataset_id')
    
    if not dataset_id:
        return jsonify(ResultFormatter.format_error_response('dataset_id required')), 400
    
    df = data_storage.get(dataset_id)
    if df is None:
        return jsonify(ResultFormatter.format_error_response('Dataset not found')), 404
    
    try:
        quality_report = quality_checker.run_full_quality_check(df)
        
        if dataset_id in audit_loggers:
            audit_loggers[dataset_id].log('quality_check', {
                'total_issues': quality_report['summary']['total_issues'],
                'quality_score': quality_report['summary']['data_quality_score']
            })
        
        return jsonify(ResultFormatter.format_success_response(quality_report))
        
    except Exception as e:
        return jsonify(ResultFormatter.format_error_response(str(e))), 500


@api_bp.route('/analysis/clean', methods=['POST'])
def clean_data():
    """
    Apply cleaning operation to dataset
    """
    data = request.get_json()
    dataset_id = data.get('dataset_id')
    operation = data.get('operation')
    params = data.get('params', {})
    
    if not dataset_id or not operation:
        return jsonify(ResultFormatter.format_error_response('dataset_id and operation required')), 400
    
    df = data_storage.get(dataset_id)
    if df is None:
        return jsonify(ResultFormatter.format_error_response('Dataset not found')), 404
    
    try:
        transformer = DataTransformer(audit_loggers.get(dataset_id))
        
        # Apply requested operation
        if operation == 'remove_duplicates':
            result = transformer.remove_duplicates(df, **params)
        elif operation == 'handle_missing':
            result = transformer.handle_missing(df, **params)
        elif operation == 'winsorize_outliers':
            result = transformer.winsorize_outliers(df, **params)
        elif operation == 'recode_values':
            result = transformer.recode_values(df, **params)
        elif operation == 'create_age_groups':
            result = transformer.create_age_groups(df, **params)
        elif operation == 'create_categories':
            result = transformer.create_categories(df, **params)
        elif operation == 'reverse_code':
            result = transformer.reverse_code(df, **params)
        elif operation == 'standardize':
            result = transformer.standardize(df, **params)
        elif operation == 'log_transform':
            result = transformer.log_transform(df, **params)
        else:
            return jsonify(ResultFormatter.format_error_response(f'Unknown operation: {operation}')), 400
        
        # Update stored dataset
        new_version = 'v2_cleaned'
        data_storage.update(dataset_id, result['data'], version=new_version)
        
        # Remove data from result (too large for response)
        result_response = {k: v for k, v in result.items() if k != 'data'}
        result_response['new_version'] = new_version
        result_response['new_row_count'] = len(result['data'])
        
        return jsonify(ResultFormatter.format_success_response(result_response))
        
    except Exception as e:
        return jsonify(ResultFormatter.format_error_response(str(e))), 500


# ============================================================================
# DESCRIPTIVE STATISTICS ENDPOINTS
# ============================================================================

@api_bp.route('/analysis/describe', methods=['POST'])
def describe_data():
    """
    Generate descriptive statistics
    """
    data = request.get_json()
    dataset_id = data.get('dataset_id')
    variables = data.get('variables')
    generate_narrative = data.get('generate_narrative', False)
    
    if not dataset_id:
        return jsonify(ResultFormatter.format_error_response('dataset_id required')), 400
    
    df = data_storage.get(dataset_id)
    if df is None:
        return jsonify(ResultFormatter.format_error_response('Dataset not found')), 404
    
    try:
        # Get descriptive statistics
        desc_stats = analyzer.get_descriptive_stats(df, variables)
        
        # Generate Table 1
        table1 = table_generator.generate_table1_characteristics(desc_stats)
        
        response_data = {
            'statistics': desc_stats,
            'table1': table1
        }
        
        # Generate AI narrative if requested
        if generate_narrative:
            narrative = ai_interpreter.generate_descriptive_narrative(desc_stats, len(df))
            response_data['narrative'] = narrative
        
        if dataset_id in audit_loggers:
            audit_loggers[dataset_id].log('descriptive_statistics', {
                'variables': variables or 'all',
                'n': len(df)
            })
        
        return jsonify(ResultFormatter.format_success_response(response_data))
        
    except Exception as e:
        return jsonify(ResultFormatter.format_error_response(str(e))), 500


# ============================================================================
# STATISTICAL ANALYSIS ENDPOINTS
# ============================================================================

@api_bp.route('/analysis/run', methods=['POST'])
def run_analysis():
    """
    Run statistical analysis
    """
    data = request.get_json()
    dataset_id = data.get('dataset_id')
    analysis_type = data.get('analysis_type')
    params = data.get('params', {})
    objective = data.get('objective', 'Examine the relationship between variables')
    interpret = data.get('interpret', True)
    
    if not dataset_id or not analysis_type:
        return jsonify(ResultFormatter.format_error_response('dataset_id and analysis_type required')), 400
    
    df = data_storage.get(dataset_id)
    if df is None:
        return jsonify(ResultFormatter.format_error_response('Dataset not found')), 404
    
    try:
        results = None
        table = None
        interpretation = None
        
        # Run appropriate analysis
        if analysis_type == 'ttest':
            results = analyzer.run_ttest(df, **params)
            if 'error' not in results:
                table = table_generator.generate_ttest_table(results)
                if interpret:
                    interpretation = ai_interpreter.interpret_ttest(results, objective)
        
        elif analysis_type == 'paired_ttest':
            params['paired'] = True
            results = analyzer.run_ttest(df, **params)
            if 'error' not in results:
                table = table_generator.generate_ttest_table(results)
                if interpret:
                    interpretation = ai_interpreter.interpret_ttest(results, objective)
        
        elif analysis_type == 'anova':
            results = analyzer.run_anova(df, **params)
            if 'error' not in results:
                table = table_generator.generate_anova_table(results)
                if interpret:
                    interpretation = ai_interpreter.interpret_anova(results, objective)
        
        elif analysis_type == 'chisquare':
            results = analyzer.run_chisquare(df, **params)
            if 'error' not in results:
                table = table_generator.generate_chisquare_table(results)
                if interpret:
                    interpretation = ai_interpreter.interpret_chisquare(results, objective)
        
        elif analysis_type == 'correlation':
            method = params.pop('method', 'pearson')
            results = analyzer.run_correlation(df, method=method, **params)
            if 'error' not in results:
                table = table_generator.generate_correlation_table(results)
                if interpret:
                    interpretation = ai_interpreter.interpret_correlation(results, objective)
        
        elif analysis_type == 'linear_regression':
            results = analyzer.run_linear_regression(df, **params)
            if 'error' not in results:
                table = table_generator.generate_regression_table(results)
                if interpret:
                    interpretation = ai_interpreter.interpret_linear_regression(results, objective)
        
        elif analysis_type == 'logistic_regression':
            results = analyzer.run_logistic_regression(df, **params)
            if 'error' not in results:
                table = table_generator.generate_logistic_regression_table(results)
                if interpret:
                    interpretation = ai_interpreter.interpret_logistic_regression(results, objective)
        
        elif analysis_type == 'mannwhitney':
            results = analyzer.run_mannwhitney(df, **params)
        
        elif analysis_type == 'kruskal':
            results = analyzer.run_kruskal(df, **params)
        
        else:
            return jsonify(ResultFormatter.format_error_response(f'Unknown analysis type: {analysis_type}')), 400
        
        if results and 'error' in results:
            return jsonify(ResultFormatter.format_error_response(results['error'])), 400
        
        # Log analysis
        if dataset_id in audit_loggers:
            audit_loggers[dataset_id].log('analysis', {
                'type': analysis_type,
                'params': params,
                'significant': results.get('significant', None) if results else None
            })
        
        response = ResultFormatter.format_results_response(results, table, interpretation)
        return jsonify(response)
        
    except Exception as e:
        return jsonify(ResultFormatter.format_error_response(str(e))), 500


@api_bp.route('/analysis/assumptions', methods=['POST'])
def check_assumptions():
    """
    Check statistical assumptions
    """
    data = request.get_json()
    dataset_id = data.get('dataset_id')
    check_type = data.get('check_type')
    params = data.get('params', {})
    
    if not dataset_id or not check_type:
        return jsonify(ResultFormatter.format_error_response('dataset_id and check_type required')), 400
    
    df = data_storage.get(dataset_id)
    if df is None:
        return jsonify(ResultFormatter.format_error_response('Dataset not found')), 404
    
    try:
        results = None
        
        if check_type == 'normality':
            variable = params.get('variable')
            if not variable:
                return jsonify(ResultFormatter.format_error_response('variable required for normality check')), 400
            results = assumption_checker.check_normality(df[variable], variable)
        
        elif check_type == 'homogeneity':
            group_var = params.get('group_var')
            outcome_var = params.get('outcome_var')
            if not group_var or not outcome_var:
                return jsonify(ResultFormatter.format_error_response('group_var and outcome_var required')), 400
            
            groups = [df[df[group_var] == g][outcome_var].values for g in df[group_var].unique()]
            group_names = [str(g) for g in df[group_var].unique()]
            results = assumption_checker.check_homogeneity_of_variance(groups, group_names)
        
        elif check_type == 'multicollinearity':
            predictors = params.get('predictors')
            if not predictors:
                return jsonify(ResultFormatter.format_error_response('predictors required')), 400
            results = assumption_checker.check_multicollinearity(df, predictors)
        
        else:
            return jsonify(ResultFormatter.format_error_response(f'Unknown check type: {check_type}')), 400
        
        return jsonify(ResultFormatter.format_success_response(results))
        
    except Exception as e:
        return jsonify(ResultFormatter.format_error_response(str(e))), 500


# ============================================================================
# RESULTS & EXPORT ENDPOINTS
# ============================================================================

@api_bp.route('/analysis/results-package', methods=['POST'])
def generate_results_package():
    """
    Generate complete results package
    """
    data = request.get_json()
    dataset_id = data.get('dataset_id')
    analyses = data.get('analyses', [])
    objectives = data.get('objectives', [])
    
    if not dataset_id:
        return jsonify(ResultFormatter.format_error_response('dataset_id required')), 400
    
    df = data_storage.get(dataset_id)
    if df is None:
        return jsonify(ResultFormatter.format_error_response('Dataset not found')), 404
    
    try:
        package = {
            'dataset_id': dataset_id,
            'sample_size': len(df),
            'analyses': analyses,
            'objectives': objectives
        }
        
        # Generate methods narrative
        tests_used = list(set([a.get('type', 'unknown') for a in analyses]))
        variables = list(df.columns)
        methods_narrative = ai_interpreter.generate_methods_narrative(tests_used, variables)
        package['methods'] = methods_narrative
        
        # Get audit trail
        if dataset_id in audit_loggers:
            package['audit_trail'] = audit_loggers[dataset_id].get_log()
        
        return jsonify(ResultFormatter.format_success_response(package))
        
    except Exception as e:
        return jsonify(ResultFormatter.format_error_response(str(e))), 500


@api_bp.route('/analysis/export', methods=['POST'])
def export_results():
    """
    Export analysis results
    """
    data = request.get_json()
    dataset_id = data.get('dataset_id')
    export_type = data.get('export_type', 'all')
    
    if not dataset_id:
        return jsonify(ResultFormatter.format_error_response('dataset_id required')), 400
    
    try:
        exports = {}
        
        # Export audit trail
        if export_type in ['all', 'audit']:
            if dataset_id in audit_loggers:
                exports['audit_trail'] = audit_loggers[dataset_id].export_markdown()
        
        # Export Python code
        if export_type in ['all', 'code']:
            analyses = data.get('analyses', [])
            exports['python_code'] = PythonCodeGenerator.generate_analysis_code(analyses)
        
        # Export data dictionary
        if export_type in ['all', 'dictionary']:
            df = data_storage.get(dataset_id)
            if df is not None:
                exports['data_dictionary'] = quality_checker.generate_data_dictionary(df)
        
        return jsonify(ResultFormatter.format_success_response(exports))
        
    except Exception as e:
        return jsonify(ResultFormatter.format_error_response(str(e))), 500


@api_bp.route('/analysis/export-data/<dataset_id>', methods=['GET'])
def export_data(dataset_id):
    """
    Export cleaned dataset as CSV
    """
    df = data_storage.get(dataset_id)
    if df is None:
        return jsonify(ResultFormatter.format_error_response('Dataset not found')), 404
    
    try:
        filepath = file_handler.export_to_csv(df, f'cleaned_{dataset_id}')
        return send_file(filepath, as_attachment=True)
    except Exception as e:
        return jsonify(ResultFormatter.format_error_response(str(e))), 500


# ============================================================================
# ANALYSIS PLAN ENDPOINT
# ============================================================================

@api_bp.route('/analysis/plan', methods=['POST'])
def create_analysis_plan():
    """
    Create analysis plan based on research objectives
    """
    data = request.get_json()
    objectives = data.get('objectives', [])
    variables = data.get('variables', {})
    design = data.get('design', 'cross-sectional')
    
    try:
        plan = []
        
        for obj in objectives:
            # Suggest analysis based on variable types
            outcome_var = obj.get('outcome')
            predictor_vars = obj.get('predictors', [])
            
            suggested_analysis = 'unknown'
            
            # Simple heuristics for suggesting analysis
            if len(predictor_vars) == 1:
                pred_type = variables.get(predictor_vars[0], {}).get('type', 'unknown')
                out_type = variables.get(outcome_var, {}).get('type', 'unknown')
                
                if pred_type == 'categorical' and out_type == 'continuous':
                    n_groups = variables.get(predictor_vars[0], {}).get('n_groups', 2)
                    suggested_analysis = 't-test' if n_groups == 2 else 'ANOVA'
                elif pred_type == 'categorical' and out_type == 'categorical':
                    suggested_analysis = 'Chi-square'
                elif pred_type == 'continuous' and out_type == 'continuous':
                    suggested_analysis = 'Correlation / Simple regression'
                elif pred_type == 'continuous' and out_type == 'binary':
                    suggested_analysis = 'Logistic regression'
            elif len(predictor_vars) > 1:
                out_type = variables.get(outcome_var, {}).get('type', 'unknown')
                if out_type == 'continuous':
                    suggested_analysis = 'Multiple linear regression'
                elif out_type == 'binary':
                    suggested_analysis = 'Multiple logistic regression'
            
            plan.append({
                'objective': obj.get('text', ''),
                'outcome': outcome_var,
                'predictors': predictor_vars,
                'suggested_analysis': suggested_analysis,
                'expected_output': f'APA table and Chapter 4 narrative'
            })
        
        return jsonify(ResultFormatter.format_success_response({
            'design': design,
            'analysis_plan': plan
        }))
        
    except Exception as e:
        return jsonify(ResultFormatter.format_error_response(str(e))), 500


# ============================================================================
# AI INTERPRETATION ENDPOINT (Direct)
# ============================================================================

@api_bp.route('/analysis/interpret', methods=['POST'])
def interpret_results():
    """
    Send results directly to AI for interpretation
    """
    data = request.get_json()
    results = data.get('results')
    objective = data.get('objective', '')
    analysis_type = data.get('analysis_type', 'general')
    
    if not results:
        return jsonify(ResultFormatter.format_error_response('results required')), 400
    
    try:
        # Call appropriate interpreter method
        if analysis_type == 'ttest':
            interpretation = ai_interpreter.interpret_ttest(results, objective)
        elif analysis_type == 'anova':
            interpretation = ai_interpreter.interpret_anova(results, objective)
        elif analysis_type == 'chisquare':
            interpretation = ai_interpreter.interpret_chisquare(results, objective)
        elif analysis_type == 'correlation':
            interpretation = ai_interpreter.interpret_correlation(results, objective)
        elif analysis_type == 'linear_regression':
            interpretation = ai_interpreter.interpret_linear_regression(results, objective)
        elif analysis_type == 'logistic_regression':
            interpretation = ai_interpreter.interpret_logistic_regression(results, objective)
        else:
            # General interpretation
            prompt = f"""
Research Objective: {objective}

Statistical Results:
{json.dumps(results, indent=2)}

Please interpret these results for a thesis.
"""
            interpretation = ai_interpreter.interpret(prompt)
        
        return jsonify(ResultFormatter.format_success_response(interpretation))
        
    except Exception as e:
        return jsonify(ResultFormatter.format_error_response(str(e))), 500

