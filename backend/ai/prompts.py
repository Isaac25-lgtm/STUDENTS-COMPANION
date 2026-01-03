"""
AI Prompt Templates for Data Analysis Lab
DeepSeek R1 Reasoner is the primary AI for interpretation
"""

# System prompt for interpreting statistical results
INTERPRETATION_SYSTEM_PROMPT = """You are interpreting statistical results for a Ugandan university student's thesis.

Your task:
1. Explain what the test found in simple terms (1-2 sentences)
2. State whether the result is statistically significant
3. Explain the effect size in practical terms (what does it mean in real life?)
4. Write an APA-style results paragraph for Chapter 4
5. Link the finding back to the research objective

Rules:
- Use simple language, avoid jargon
- Always report: test statistic, p-value, effect size with CI
- Say "significant" only if p < 0.05
- Interpret effect sizes: small, medium, large and what that means practically
- Do not invent or change any numbers - use exactly what Python calculated
- Format for thesis: past tense, third person
- Keep explanations concise but complete
"""

# Template for sending results to AI
INTERPRETATION_MESSAGE_TEMPLATE = """
Research Objective: {objective}

Statistical Results:
{results_json}

Generate:
1. Plain English interpretation (2-3 sentences)
2. Effect size meaning (practical significance)
3. APA results paragraph for Chapter 4
4. One-sentence answer to the research objective
"""

# Prompts by test type
INTERPRETATION_PROMPTS = {
    'ttest': """
Interpret these t-test results for a thesis:

Test: {test_type}
Groups: {group1} (n={n1}, M={mean1}, SD={sd1}) vs {group2} (n={n2}, M={mean2}, SD={sd2})
t({df}) = {t_stat}, p = {p_value}
Cohen's d = {cohens_d} [{ci_lower}, {ci_upper}]
Effect size: {effect_interpretation}

Research objective: {objective}

Provide:
1. Plain English explanation (what does this mean?)
2. Statistical significance statement
3. Practical significance (is the effect meaningful in real life?)
4. APA-formatted paragraph for Chapter 4
5. Answer to the research objective
""",

    'anova': """
Interpret these ANOVA results for a thesis:

Test: One-way ANOVA
Groups: {groups}
F({df_between}, {df_within}) = {f_stat}, p = {p_value}
η² = {eta_squared} ({effect_interpretation})

Group means:
{group_means}

Significant post-hoc comparisons:
{posthoc}

Research objective: {objective}

Provide:
1. Plain English explanation
2. Which groups differ significantly
3. Practical meaning of the effect size
4. APA-formatted paragraph for Chapter 4
5. Answer to the research objective
""",

    'chisquare': """
Interpret these Chi-square results for a thesis:

Test: {test_type}
χ²({df}) = {chi_stat}, p = {p_value}
Cramér's V = {cramers_v} ({effect_interpretation})
N = {sample_size}

Contingency table:
{contingency_table}

Research objective: {objective}

Provide:
1. Plain English explanation (is there an association?)
2. Strength of the association
3. Which categories show the strongest relationship
4. APA-formatted paragraph for Chapter 4
5. Answer to the research objective
""",

    'correlation': """
Interpret these correlation results for a thesis:

Test: {test_type}
Variables: {var1} and {var2}
r = {r}, p = {p_value}
95% CI [{ci_lower}, {ci_upper}]
r² = {r_squared}
Interpretation: {strength} {direction} correlation

Research objective: {objective}

Provide:
1. Plain English explanation
2. Strength and direction of relationship
3. How much variance is explained (r²)
4. APA-formatted paragraph for Chapter 4
5. Answer to the research objective
""",

    'regression_linear': """
Interpret these linear regression results for a thesis:

Model: {outcome} predicted by {predictors}
R² = {r_squared}, Adjusted R² = {r_squared_adj}
F({df1}, {df2}) = {f_stat}, p = {f_p}
N = {sample_size}

Coefficients:
{coefficients_table}

Research objective: {objective}

Provide:
1. Overall model interpretation (does it predict the outcome?)
2. Which predictors are significant and their effects
3. Practical meaning (for every unit increase in X, Y changes by...)
4. APA-formatted paragraph for Chapter 4
5. Answer to the research objective
""",

    'regression_logistic': """
Interpret these logistic regression results for a thesis:

Model: {outcome} predicted by {predictors}
Pseudo R² = {pseudo_r2}
Model χ² p = {model_p}
Classification accuracy = {accuracy}%
N = {sample_size}

Coefficients:
{coefficients_table}

Research objective: {objective}

Provide:
1. Overall model interpretation
2. Significant predictors and their odds ratios
3. Practical meaning (odds of outcome increase/decrease by X times when...)
4. APA-formatted paragraph for Chapter 4
5. Answer to the research objective
"""
}

# Descriptive statistics narrative prompt
DESCRIPTIVE_NARRATIVE_PROMPT = """
Generate a Chapter 4 narrative for these sample characteristics:

Sample size: {n}
Continuous variables:
{continuous_stats}

Categorical variables:
{categorical_stats}

Write 2-3 paragraphs describing the sample for a thesis Chapter 4.
Use past tense, third person.
Start with: "A total of {n} participants were included in this study..."
"""

# Qualitative analysis prompts
QUALITATIVE_PROMPTS = {
    'coding': """
Help analyze this qualitative data excerpt for a thesis:

Excerpt: "{excerpt}"

Research question: {research_question}

Suggest:
1. Initial codes (3-5 codes that capture key ideas)
2. Brief definition for each code
3. Which part of the excerpt supports each code
""",

    'theme_development': """
Help develop themes from these codes for a thesis:

Codes and their frequencies:
{codes}

Research question: {research_question}

Suggest:
1. Potential theme that groups related codes
2. Theme definition (1-2 sentences)
3. How this theme answers the research question
""",

    'theme_narrative': """
Write a Chapter 4 narrative for this qualitative theme:

Theme: {theme_name}
Definition: {theme_definition}

Supporting quotes:
{quotes}

Research question: {research_question}

Write 2-3 paragraphs presenting this theme with integrated quotes.
Use past tense, third person.
Format quotes properly with participant identifiers (e.g., "..." - P5).
"""
}

# Mixed methods integration prompt
MIXED_METHODS_PROMPT = """
Create an integrated findings section for mixed methods research:

Quantitative findings:
{quant_findings}

Qualitative themes:
{qual_themes}

Research objective: {objective}

Generate:
1. A joint display table showing quant-qual alignment
2. Integration narrative (how findings converge, complement, or contradict)
3. Meta-inference (what the combined findings tell us)
"""

# Methods section template
METHODS_NARRATIVE_PROMPT = """
Generate a data analysis methods section for Chapter 3:

Analysis details:
- Statistical software: Python with SciPy and Statsmodels
- Significance level: α = 0.05
- Tests performed: {tests_used}
- Variables analyzed: {variables}

Write 1-2 paragraphs describing the data analysis approach for a thesis.
Include mention of assumption checking and effect size reporting.
"""

