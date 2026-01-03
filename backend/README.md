# Data Analysis Lab - Python Backend

Flask-based backend for the Students Companion Data Analysis Lab module.

## Features

- **Accurate Statistical Calculations**: All statistics computed by Python (scipy, statsmodels)
- **AI Interpretation**: Results interpreted by DeepSeek R1 (with Gemini fallback)
- **APA Tables**: Automatically formatted publication-ready tables
- **Data Cleaning**: Comprehensive data quality checks and transformations
- **Audit Trail**: Complete logging of all transformations for reproducibility

## Quick Start

### Windows
```bash
# Navigate to backend folder
cd backend

# Run the startup script
start_backend.bat
```

### Manual Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your API keys
# Copy .env.example to .env and fill in your keys

# Run the server
python run.py
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/analysis/import` | POST | Import data file |
| `/api/analysis/datasets` | GET | List all datasets |
| `/api/analysis/quality-check` | POST | Run data quality check |
| `/api/analysis/clean` | POST | Apply cleaning operation |
| `/api/analysis/describe` | POST | Get descriptive statistics |
| `/api/analysis/run` | POST | Run statistical analysis |
| `/api/analysis/assumptions` | POST | Check statistical assumptions |
| `/api/analysis/results-package` | POST | Generate results package |
| `/api/analysis/export` | POST | Export results |

## Supported Analyses

### Bivariate Tests
- Independent t-test
- Paired t-test
- One-way ANOVA
- Mann-Whitney U
- Kruskal-Wallis
- Chi-square
- Fisher's exact
- Pearson correlation
- Spearman correlation

### Regression Models
- Simple linear regression
- Multiple linear regression
- Binary logistic regression
- Ordinal logistic regression
- Poisson regression
- Negative binomial regression

## Environment Variables

Create a `.env` file in the backend folder:

```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_secret_key_here
```

## Project Structure

```
backend/
├── api/
│   └── routes.py           # Flask API endpoints
├── analysis/
│   ├── statistics.py       # Statistical functions
│   ├── assumptions.py      # Assumption checking
│   └── tables.py          # APA table generators
├── cleaning/
│   ├── quality.py         # Data quality checks
│   ├── transformations.py # Data recoding
│   ├── audit.py          # Audit trail logging
│   └── reliability.py    # Cronbach's alpha
├── ai/
│   ├── interpreter.py     # AI interpretation
│   └── prompts.py        # Prompt templates
├── utils/
│   ├── file_handlers.py   # File import/export
│   └── formatters.py      # Output formatting
├── app.py                 # Flask app initialization
├── config.py              # Configuration
├── run.py                # Run script
└── requirements.txt       # Dependencies
```

## Usage with Frontend

The frontend automatically communicates with this backend when available.
Start both servers:

1. Start backend: `cd backend && python run.py` (port 5000)
2. Start frontend: `npm run dev` (port 3000)

The frontend will detect the backend and use Python for accurate calculations.

