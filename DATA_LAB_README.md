# Students Companion - Data Analysis Lab

A comprehensive academic assistant powered by **DeepSeek R1 Reasoner** for intelligent data analysis.

## 🚀 Recent Updates

### Removed Python Backend
The application now uses **DeepSeek R1 Reasoner** for all data analysis tasks, eliminating the need for a Python backend. This provides:

- ✅ **Simpler setup** - No Python environment needed
- ✅ **AI-powered reasoning** - Chain-of-thought analysis
- ✅ **Better interpretations** - Natural language explanations
- ✅ **Faster deployment** - Single-stack architecture

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Key

Create a `.env.local` file in the root directory:

```env
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

Get your API key from: [https://platform.deepseek.com/](https://platform.deepseek.com/)

### 3. Run Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173/`

## 📊 Data Analysis Lab Features

### Supported File Formats
- **CSV** (.csv)
- **Excel** (.xlsx, .xls)

### Analysis Types

#### 1. Quantitative Analysis
- Descriptive statistics
- Data quality checks
- Statistical tests (t-test, ANOVA, correlation, regression)
- AI-powered interpretation

#### 2. Qualitative Analysis
- Thematic analysis
- Coding assistance
- Theme development

#### 3. Mixed Methods
- Integration of quantitative and qualitative data
- Joint display tables
- Triangulation

## 🧠 How It Works

### Client-Side Data Processing
- **Parsing**: Uses `papaparse` for CSV and `xlsx` for Excel files
- **Statistics**: Basic calculations with `simple-statistics`
- **Storage**: In-memory data management

### AI-Powered Analysis
All complex statistical analysis and interpretation is handled by **DeepSeek R1 Reasoner**, which:
- Performs statistical calculations
- Checks assumptions
- Generates APA-formatted results
- Provides plain English interpretations
- Shows chain-of-thought reasoning

## 📁 Project Structure

```
src/
├── services/
│   ├── dataAnalysisR1.ts    # DeepSeek R1 data analysis service
│   ├── dataLabAI.ts          # AI supervisor orchestration
│   ├── deepseek.ts           # DeepSeek API service
│   └── gemini.ts             # Gemini API service (optional)
├── pages/
│   ├── DataLab.tsx           # Data Analysis Lab page
│   ├── Ask.tsx               # AI tutor
│   ├── Research.tsx          # Research proposal generator
│   └── ...
└── components/
    └── ...
```

## 🔧 Technologies

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI**: DeepSeek R1 Reasoner
- **Data Processing**: PapaParse, XLSX, Simple Statistics

## 🎯 Usage Example

1. **Start Analysis**: Choose analysis type (Quantitative/Qualitative/Mixed)
2. **Upload Data**: Drag and drop your CSV or Excel file
3. **Quality Check**: Review automatic data quality report
4. **Analyze**: Chat with AI to run statistical tests
5. **Export**: Download thesis-ready results

## 📝 Available Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🐛 Troubleshooting

### API Key Issues
- Ensure your `.env.local` file has `VITE_DEEPSEEK_API_KEY` set
- Restart the dev server after adding the key
- Check API key validity at [platform.deepseek.com](https://platform.deepseek.com/)

### File Upload Issues
- Supported formats: CSV, Excel (.xlsx, .xls)
- Maximum recommended size: 10MB
- Ensure proper column headers

### Analysis Errors
- Check that you have sufficient API credits
- Verify data format is correct
- Ensure variables are properly named

## 📚 Documentation

For detailed guides, see:
- [Data Analysis Workflow](docs/data-analysis.md)
- [API Integration](docs/api-integration.md)
- [Feature Guides](docs/features.md)

## 🤝 Contributing

This is an educational project for Ugandan university students. Contributions welcome!

## 📄 License

MIT License - see LICENSE file for details

---

**Note**: The Python backend has been removed. If you need the old backend, check git history for the `backend/` folder.


