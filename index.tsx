import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// --- Type Definitions ---
type MechanicalTest = {
    id: number;
    actualFailureStrength: string;
    maxDispAt1_5x: string;
    residualDispAfterLoad: string;
};

type MechanicalTestsState = {
    [key: string]: MechanicalTest[];
};

const POLE_TYPES = [
    { label: "9/200", nominalStrength: "200", poleLength: "9" },
    { label: "9/400", nominalStrength: "400", poleLength: "9" },
    { label: "9/600", nominalStrength: "600", poleLength: "9" },
    { label: "9/800", nominalStrength: "800", poleLength: "9" },
    { label: "9/1000", nominalStrength: "1000", poleLength: "9" },
    { label: "9/1200", nominalStrength: "1200", poleLength: "9" },
    { label: "12/200", nominalStrength: "200", poleLength: "12" },
    { label: "12/400", nominalStrength: "400", poleLength: "12" },
    { label: "12/600", nominalStrength: "600", poleLength: "12" },
    { label: "12/800", nominalStrength: "800", poleLength: "12" },
    { label: "12/1000", nominalStrength: "1000", poleLength: "12" },
    { label: "12/1200", nominalStrength: "1200", poleLength: "12" },
    { label: "15/200", nominalStrength: "200", poleLength: "15" },
    { label: "15/400", nominalStrength: "400", poleLength: "15" },
    { label: "15/600", nominalStrength: "600", poleLength: "15" },
    { label: "15/800", nominalStrength: "800", poleLength: "15" },
    { label: "15/1000", nominalStrength: "1000", poleLength: "15" },
    { label: "15/1200", nominalStrength: "1200", poleLength: "15" },
];

const initialInputs = {
    sandFinenessModulus: '', sandClayImpurity: '', gravelClayImpurity: '', sandValue: '',
    suspendedSolids: '', dissolvedSolids: '', chlorideIons: '', sulfateIons: '', alkaliEquivalent: '', waterPH: '',
    sat_quality: '', sat_stability: '', sat_performance: '', sat_commitment: '', sat_disposal: '',
    warrantyYears: '', historyYears: '', annualCapacity: '', lifespanYears: '',
    prodLineQuality: { line: false, materials: false, processing: false },
    prodMethod: '40', mixerType: '40', permeability: '40', transportDistance: '40',
};

const initialHeader = { company: '', tender: '', date: '' };

const scoreLabels = {
    stoneQuality: { label: "کیفیت مصالح سنگی", weight: 15 }, waterQuality: { label: "کیفیت آب مصرفی", weight: 10 },
    satisfaction: { label: "میزان رضایت بهره بردار", weight: 5 }, failureLimit: { label: "حد گسیختگی پایه", weight: 10 },
    residualDisp: { label: "تغییر مکان باقی مانده رأس پایه", weight: 5 }, warranty: { label: "مدت گارانتی تعویض", weight: 3 },
    history: { label: "سابقه تولید", weight: 3 }, capacity: { label: "ظرفیت تولید سالانه", weight: 3 },
    lifespan: { label: "طول عمر پایه", weight: 5 }, prodLineQuality: { label: "کیفیت خط تولید و دپو", weight: 5 },
    prodMethod: { label: "روش تولید", weight: 13 }, mixerType: { label: "نوع میکسر", weight: 5 },
    permeability: { label: "نفوذپذیری و دوام بتن", weight: 15 }, transportDistance: { label: "مسافت حمل", weight: 3 },
};

// --- Helper Components ---
const Gauge = ({ value }) => {
    const min = 0, max = 100;
    const clampedValue = Math.max(min, Math.min(value, max));
    const percentage = (clampedValue - min) / (max - min);
    const angle = 180 * percentage;
    const circumference = Math.PI * 90;
    const dashArray = `${(circumference * angle) / 180} ${circumference}`;

    const getColor = (val) => {
        if (val < 60) return 'var(--danger-color)'; if (val < 80) return 'var(--warning-color)'; return 'var(--success-color)';
    };
    return (
        <div className="gauge-container">
            <svg width="200" height="100" viewBox="0 0 200 100">
                <path className="gauge-background" d="M 10 100 A 90 90 0 0 1 190 100" />
                <path className="gauge-arc" d="M 10 100 A 90 90 0 0 1 190 100" stroke={getColor(clampedValue)} strokeDasharray={dashArray} />
                <text x="100" y="90" textAnchor="middle" className="gauge-text">{value.toFixed(2)}</text>
            </svg>
        </div>
    );
};

// Fix: Define prop types for InputGroup to resolve issues with 'key' prop and ensure type safety.
type InputGroupProps = {
    label: any;
    name: any;
    value: any;
    onChange: any;
    onBlur: any;
    type?: string;
    step?: string;
    children?: React.ReactNode;
    unit?: string;
    placeholder?: string;
    error?: any;
    readOnly?: boolean;
};

const InputGroup: React.FC<InputGroupProps> = ({ label, name, value, onChange, onBlur, type = "number", step = "any", children = null, unit = '', placeholder = '', error = null, readOnly = false }) => (
    <div className="input-group">
        <label htmlFor={name}>{label} {unit && `(${unit})`}</label>
        {type === "select" ? (
            <select id={name} name={name} value={value} onChange={onChange} onBlur={onBlur}>{children}</select>
        ) : type === 'checkbox' ? (
            <label className="checkbox-group">
                <input id={name} type="checkbox" name={name} checked={value} onChange={onChange} onBlur={onBlur} />
                <span>{children}</span>
            </label>
        ) : (
            <input id={name} type={type} name={name} value={value} onChange={onChange} onBlur={onBlur} step={step} placeholder={placeholder} className={error ? 'error' : ''} readOnly={readOnly} />
        )}
        {error && <span className="error-message">{error}</span>}
    </div>
);

const Card = ({ title, subtitle = '', id = '', children }: { title: string, subtitle?: string, id?: string, children?: React.ReactNode }) => (
    <details className="card" id={id} open>
        <summary><div>{title}{subtitle && <span className="card-subtitle">{subtitle}</span>}</div></summary>
        <div className="card-content">{children}</div>
    </details>
);

// --- Main Application ---
const App = () => {
    const [header, setHeader] = useState(initialHeader);
    const [selectedPoleTypes, setSelectedPoleTypes] = useState<string[]>([]);
    const [mechanicalTests, setMechanicalTests] = useState<MechanicalTestsState>({});
    const [inputs, setInputs] = useState(initialInputs);
    const [errors, setErrors] = useState({});

    // --- Handlers ---
    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHeader(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePoleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setSelectedPoleTypes(prev => {
            const newSelection = checked ? [...prev, name] : prev.filter(pt => pt !== name);
            // Sort to maintain consistent order
            return newSelection.sort((a, b) => POLE_TYPES.findIndex(p => p.label === a) - POLE_TYPES.findIndex(p => p.label === b));
        });

        if (checked && !mechanicalTests[name]) {
            setMechanicalTests(prev => ({ ...prev, [name]: [{ id: Date.now(), actualFailureStrength: '', maxDispAt1_5x: '', residualDispAfterLoad: '' }] }));
        }
        // Note: We don't remove data on uncheck to prevent accidental data loss. It will just be ignored in calculations.
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setInputs(prev => ({ ...prev, prodLineQuality: { ...prev.prodLineQuality, [name]: checked } }));
        } else {
            setInputs(prev => ({ ...prev, [name]: value }));
        }
        if (errors[name]) validateField(name, value);
    };

    const handleMechanicalTestChange = (poleType: string, id: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMechanicalTests(prev => ({
            ...prev,
            [poleType]: prev[poleType].map(test => test.id === id ? { ...test, [name]: value } : test)
        }));
        const testIndex = mechanicalTests[poleType].findIndex(t => t.id === id);
        const errorKey = `${name}_${poleType}_${testIndex}`;
        if (errors[errorKey]) validateField(name, value, poleType, testIndex);
    };

    const addMechanicalTest = (poleType: string) => {
        if (mechanicalTests[poleType]?.length < 3) {
            setMechanicalTests(prev => ({ ...prev, [poleType]: [...prev[poleType], { id: Date.now(), actualFailureStrength: '', maxDispAt1_5x: '', residualDispAfterLoad: '' }] }));
        }
    };

    const removeMechanicalTest = (poleType: string, id: number) => {
        const testIndex = mechanicalTests[poleType].findIndex(t => t.id === id);
        setMechanicalTests(prev => ({ ...prev, [poleType]: prev[poleType].filter(test => test.id !== id) }));
        
        const newErrors = { ...errors };
        Object.keys(newErrors).forEach(key => { if (key.endsWith(`_${poleType}_${testIndex}`)) delete newErrors[key]; });
        setErrors(newErrors);
    };

    const handleReset = () => {
        setHeader(initialHeader);
        setSelectedPoleTypes([]);
        setMechanicalTests({});
        setInputs(initialInputs);
        setErrors({});
    };

    // --- Validation ---
    const validationSchema = {
        sandFinenessModulus: { min: 2.3, max: 3.1, message: "باید بین ۲.۳ و ۳.۱ باشد" },
        sandClayImpurity: { max: 2, message: "باید کمتر از ۲٪ باشد" }, gravelClayImpurity: { max: 3, message: "باید کمتر از ۳٪ باشد" },
        sandValue: { min: 75, message: "باید بیشتر از ۷۵٪ باشد" }, suspendedSolids: { max: 1000, message: "باید کمتر از ۱۰۰۰ باشد" },
        dissolvedSolids: { max: 1000, message: "باید کمتر از ۱۰۰۰ باشد" }, chlorideIons: { max: 500, message: "باید کمتر از ۵۰۰ باشد" },
        sulfateIons: { max: 1000, message: "باید کمتر از ۱۰۰۰ باشد" }, alkaliEquivalent: { max: 600, message: "باید کمتر از ۶۰۰ باشد" },
        waterPH: { min: 5.5, max: 8.5, message: "باید بین ۵.۵ و ۸.۵ باشد" },
        sat_quality: { min: 0, max: 8, message: "باید بین ۰ و ۸ باشد" }, sat_stability: { min: 0, max: 8, message: "باید بین ۰ و ۸ باشد" },
        sat_performance: { min: 0, max: 8, message: "باید بین ۰ و ۸ باشد" }, sat_commitment: { min: 0, max: 8, message: "باید بین ۰ و ۸ باشد" },
        sat_disposal: { min: 0, max: 8, message: "باید بین ۰ و ۸ باشد" },
        warrantyYears: { min: 2, message: "حداقل ۲ سال" }, lifespanYears: { min: 40, message: "حداقل ۴۰ سال" },
        actualFailureStrength: { min: 0, message: "نمیتواند منفی باشد" }, maxDispAt1_5x: { min: 0, message: "نمیتواند منفی باشد" },
        residualDispAfterLoad: { min: 0, message: "نمیتواند منفی باشد" },
    };

    const validateField = (name, value, poleType = null, index = -1) => {
        const rule = validationSchema[name];
        if (!rule) return;
        
        const key = poleType ? `${name}_${poleType}_${index}` : name;
        if (value === '') { setErrors(prev => ({ ...prev, [key]: null })); return; }

        const numValue = parseFloat(value);
        let error = null;
        if (isNaN(numValue)) { error = "مقدار باید عددی باشد"; } 
        else if (rule.min !== undefined && numValue < rule.min) { error = rule.message || `مقدار باید حداقل ${rule.min} باشد`; } 
        else if (rule.max !== undefined && numValue > rule.max) { error = rule.message || `مقدار باید حداکثر ${rule.max} باشد`; }
        setErrors(prev => ({ ...prev, [key]: error }));
    };

    const handleBlur = (e, poleType = null, index = -1) => { validateField(e.target.name, e.target.value, poleType, index); };

    // --- Calculations ---
    const calculations = useMemo(() => {
        const scores: Record<string, number> = {};
        const areNumbers = (...vals) => vals.every(v => v !== null && v !== '' && !isNaN(parseFloat(v)));
        const getNum = (val) => parseFloat(String(val));
        const baseScore = 60;

        // 1. Stone Quality
        let stoneQualityScore = baseScore;
        if (areNumbers(inputs.sandFinenessModulus, inputs.sandClayImpurity, inputs.gravelClayImpurity, inputs.sandValue)) {
            const score1a = 50 * (0.4 - Math.abs(getNum(inputs.sandFinenessModulus) - 2.7));
            const score1b = 500 * (0.02 - getNum(inputs.sandClayImpurity) / 100);
            const score1c = 250 * (0.03 - getNum(inputs.gravelClayImpurity) / 100);
            const score1d = 100 * (getNum(inputs.sandValue) / 100 - 0.75);
            const totalStonePoints = Math.min(20, Math.max(0, score1a)) + Math.min(5, Math.max(0, score1b)) + Math.min(5, Math.max(0, score1c)) + Math.min(10, Math.max(0, score1d));
            stoneQualityScore += totalStonePoints;
        }
        scores.stoneQuality = stoneQualityScore * 0.15;

        // 2. Water Quality
        let waterQualityScore = baseScore;
        if (areNumbers(inputs.suspendedSolids, inputs.dissolvedSolids, inputs.chlorideIons, inputs.sulfateIons, inputs.alkaliEquivalent, inputs.waterPH)) {
            waterQualityScore += Math.min(5, Math.max(0, 0.01 * (1000 - getNum(inputs.suspendedSolids))));
            waterQualityScore += Math.min(5, Math.max(0, 0.01 * (1000 - getNum(inputs.dissolvedSolids))));
            waterQualityScore += Math.min(5, Math.max(0, 0.02 * (500 - getNum(inputs.chlorideIons))));
            waterQualityScore += Math.min(5, Math.max(0, 0.01 * (1000 - getNum(inputs.sulfateIons))));
            waterQualityScore += Math.min(5, Math.max(0, 0.0125 * (600 - getNum(inputs.alkaliEquivalent))));
            waterQualityScore += Math.min(15, Math.max(0, 10 * (1.5 - Math.abs(getNum(inputs.waterPH) - 7))));
        }
        scores.waterQuality = waterQualityScore * 0.10;
        
        // 3. Satisfaction
        let satisfactionScore = baseScore;
        const satInputs = [inputs.sat_quality, inputs.sat_stability, inputs.sat_performance, inputs.sat_commitment, inputs.sat_disposal];
        if (areNumbers(...satInputs)) {
            const totalSatPoints = satInputs.reduce((sum, val) => sum + getNum(val), 0);
            satisfactionScore += totalSatPoints;
        }
        scores.satisfaction = satisfactionScore * 0.05;
        
        // Mechanical Tests (4 & 5)
        const failureLimitScoresByPoleType: number[] = [];
        const residualDispScoresByPoleType: number[] = [];
        
        if (selectedPoleTypes.length > 0) {
            selectedPoleTypes.forEach(poleType => {
                const tests = mechanicalTests[poleType];
                const poleInfo = POLE_TYPES.find(p => p.label === poleType)!;
                const nominalStrength = getNum(poleInfo.nominalStrength);

                if (!tests || tests.length === 0) {
                    failureLimitScoresByPoleType.push(0);
                    residualDispScoresByPoleType.push(0);
                } else {
                    const testFailureScores = tests.map(test => {
                        if (!areNumbers(test.actualFailureStrength)) return baseScore;
                        const failureRatio = getNum(test.actualFailureStrength) / (nominalStrength * 2);
                        return baseScore + Math.max(0, 80 * (failureRatio - 1));
                    });
                    const avgFailure = testFailureScores.reduce((a, b) => a + b, 0) / testFailureScores.length;
                    failureLimitScoresByPoleType.push(avgFailure);

                    const testResidualDispScores = tests.map(test => {
                        if (!areNumbers(test.residualDispAfterLoad)) return baseScore;
                        const residualDisp = getNum(test.residualDispAfterLoad);
                        return baseScore + Math.max(0, 8 * (10 - residualDisp));
                    });
                    const avgResidual = testResidualDispScores.reduce((a, b) => a + b, 0) / testResidualDispScores.length;
                    residualDispScoresByPoleType.push(avgResidual);
                }
            });
        }
        
        const finalAvgFailure = failureLimitScoresByPoleType.length > 0 ? failureLimitScoresByPoleType.reduce((a,b) => a+b, 0) / failureLimitScoresByPoleType.length : baseScore;
        const finalAvgResidual = residualDispScoresByPoleType.length > 0 ? residualDispScoresByPoleType.reduce((a,b) => a+b, 0) / residualDispScoresByPoleType.length : baseScore;
        scores.failureLimit = finalAvgFailure * 0.10;
        scores.residualDisp = finalAvgResidual * 0.05;

        // Other scores
        scores.warranty = (areNumbers(inputs.warrantyYears) ? baseScore + Math.max(0, 40 * (getNum(inputs.warrantyYears) - 2)) : baseScore) * 0.03;
        scores.history = (areNumbers(inputs.historyYears) ? baseScore + Math.max(0, 2 * getNum(inputs.historyYears)) : baseScore) * 0.03;
        scores.capacity = (areNumbers(inputs.annualCapacity) ? baseScore + Math.max(0, 0.004 * getNum(inputs.annualCapacity)) : baseScore) * 0.03;
        scores.lifespan = (areNumbers(inputs.lifespanYears) ? baseScore + Math.max(0, 2 * (getNum(inputs.lifespanYears) - 40)) : baseScore) * 0.05;
        
        let prodQualityPoints = 0;
        if (inputs.prodLineQuality.line && inputs.prodLineQuality.materials && inputs.prodLineQuality.processing) prodQualityPoints = 40;
        else if (inputs.prodLineQuality.line && (inputs.prodLineQuality.materials || inputs.prodLineQuality.processing)) prodQualityPoints = 20;
        scores.prodLineQuality = (baseScore + prodQualityPoints) * 0.05;

        scores.prodMethod = (baseScore + getNum(inputs.prodMethod)) * 0.13;
        scores.mixerType = (baseScore + getNum(inputs.mixerType)) * 0.05;
        scores.permeability = (baseScore + getNum(inputs.permeability)) * 0.15;
        scores.transportDistance = (baseScore + getNum(inputs.transportDistance)) * 0.03;

        const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
        return { scores, totalScore };
    }, [inputs, mechanicalTests, selectedPoleTypes]);

    return (
        <div className="app-container">
            <header><h1>محاسبه امتیاز فنی شرکت در مناقصه</h1></header>
            <div className="main-content">
                <div className="form-container">
                    <Card title="اطلاعات مناقصه" id="header-card">
                        <div className="header-inputs">
                            {/* Fix: Add missing onBlur prop to satisfy component requirements. */}
                            <InputGroup label="نام شرکت" name="company" value={header.company} onChange={handleHeaderChange} type="text" onBlur={() => {}} />
                            {/* Fix: Add missing onBlur prop to satisfy component requirements. */}
                            <InputGroup label="شماره مناقصه" name="tender" value={header.tender} onChange={handleHeaderChange} type="text" onBlur={() => {}} />
                            {/* Fix: Add missing onBlur prop to satisfy component requirements. */}
                            <InputGroup label="تاریخ ارزیابی" name="date" value={header.date} onChange={handleHeaderChange} type="text" onBlur={() => {}} />
                        </div>
                        <div className="pole-type-grid">
                            <h4>تیپ پایه‌های مورد درخواست در مناقصه</h4>
                            {POLE_TYPES.map(pt => (
                                <InputGroup key={pt.label} label="" name={pt.label} value={selectedPoleTypes.includes(pt.label)} onChange={handlePoleTypeChange} type="checkbox" onBlur={handleBlur}>{pt.label}</InputGroup>
                            ))}
                        </div>
                    </Card>
                    
                    <Card title="۱. کیفیت مصالح سنگی"><InputGroup label="ضریب نرمی ماسه" name="sandFinenessModulus" value={inputs.sandFinenessModulus} onChange={handleChange} onBlur={handleBlur} placeholder="۲.۳ - ۳.۱" error={errors.sandFinenessModulus}/><InputGroup label="خاک رس در ماسه" unit="%" name="sandClayImpurity" value={inputs.sandClayImpurity} onChange={handleChange} onBlur={handleBlur} placeholder="حداکثر ۲٪" error={errors.sandClayImpurity}/><InputGroup label="خاک رس در شن" unit="%" name="gravelClayImpurity" value={inputs.gravelClayImpurity} onChange={handleChange} onBlur={handleBlur} placeholder="حداکثر ۳٪" error={errors.gravelClayImpurity}/><InputGroup label="ارزش ماسه‌ای" unit="%" name="sandValue" value={inputs.sandValue} onChange={handleChange} onBlur={handleBlur} placeholder="حداقل ۷۵٪" error={errors.sandValue}/></Card>
                    <Card title="۲. کیفیت آب مصرفی"><InputGroup label="ذرات جامد معلق" unit="ppm" name="suspendedSolids" value={inputs.suspendedSolids} onChange={handleChange} onBlur={handleBlur} placeholder="حداکثر ۱۰۰۰" error={errors.suspendedSolids}/><InputGroup label="کل مواد محلول" unit="ppm" name="dissolvedSolids" value={inputs.dissolvedSolids} onChange={handleChange} onBlur={handleBlur} placeholder="حداکثر ۱۰۰۰" error={errors.dissolvedSolids}/><InputGroup label="یون کلرید" unit="ppm" name="chlorideIons" value={inputs.chlorideIons} onChange={handleChange} onBlur={handleBlur} placeholder="حداکثر ۵۰۰" error={errors.chlorideIons}/><InputGroup label="یون سولفات" unit="ppm" name="sulfateIons" value={inputs.sulfateIons} onChange={handleChange} onBlur={handleBlur} placeholder="حداکثر ۱۰۰۰" error={errors.sulfateIons}/><InputGroup label="قلیایی معادل" unit="ppm" name="alkaliEquivalent" value={inputs.alkaliEquivalent} onChange={handleChange} onBlur={handleBlur} placeholder="حداکثر ۶۰۰" error={errors.alkaliEquivalent}/><InputGroup label="PH آب" name="waterPH" value={inputs.waterPH} onChange={handleChange} onBlur={handleBlur} placeholder="۵.۵ - ۸.۵" error={errors.waterPH}/></Card>
                    <Card title="۳. میزان رضایت بهره‌بردار" subtitle="(امتیاز میانگین فرم ها در این کادر وارد شود)"><InputGroup label="کیفیت ساخت" name="sat_quality" value={inputs.sat_quality} onChange={handleChange} onBlur={handleBlur} placeholder="۰-۸" error={errors.sat_quality}/><InputGroup label="چگونگی استقرار" name="sat_stability" value={inputs.sat_stability} onChange={handleChange} onBlur={handleBlur} placeholder="۰-۸" error={errors.sat_stability}/><InputGroup label="عملکرد" name="sat_performance" value={inputs.sat_performance} onChange={handleChange} onBlur={handleBlur} placeholder="۰-۸" error={errors.sat_performance}/><InputGroup label="تعهدات" name="sat_commitment" value={inputs.sat_commitment} onChange={handleChange} onBlur={handleBlur} placeholder="۰-۸" error={errors.sat_commitment}/><InputGroup label="امحاء تولیدات مردود" name="sat_disposal" value={inputs.sat_disposal} onChange={handleChange} onBlur={handleBlur} placeholder="۰-۸" error={errors.sat_disposal}/></Card>
                    
                    <Card title="۴ و ۵. نتایج آزمون‌های مکانیکی">
                        {selectedPoleTypes.length === 0 && <p>ابتدا تیپ پایه‌های مورد درخواست در مناقصه را از بخش اطلاعات مناقصه انتخاب کنید.</p>}
                        {selectedPoleTypes.map(poleType => {
                            const testsForType = mechanicalTests[poleType] || [];
                            const poleInfo = POLE_TYPES.find(p => p.label === poleType)!;
                            return (
                                <div className="pole-test-section" key={poleType}>
                                    <h3>نتایج آزمون برای پایه {poleType}</h3>
                                    {testsForType.map((test, index) => (
                                        <div className="pole-test-card" key={test.id}>
                                            <div className="pole-test-header"><h4>برگه آزمون #{index + 1}</h4>{testsForType.length > 1 && <button className="remove-button" onClick={() => removeMechanicalTest(poleType, test.id)}>حذف</button>}</div>
                                            <div className="pole-test-inputs">
                                                <InputGroup label="نیروی اسمی" unit="kgf" name="nominalStrength" value={poleInfo.nominalStrength} readOnly={true} onChange={()=>{}} onBlur={()=>{}} />
                                                <InputGroup label="طول پایه" unit="m" name="poleLength" value={poleInfo.poleLength} readOnly={true} onChange={()=>{}} onBlur={()=>{}}/>
                                                <InputGroup label="نیروی گسیختگی" unit="kgf" name="actualFailureStrength" value={test.actualFailureStrength} onChange={(e) => handleMechanicalTestChange(poleType, test.id, e)} onBlur={(e) => handleBlur(e, poleType, index)} placeholder="مثال: ۸۵۰" error={errors[`actualFailureStrength_${poleType}_${index}`]}/>
                                                <InputGroup label="حداکثر تغییرمکان" unit="mm" name="maxDispAt1_5x" value={test.maxDispAt1_5x} onChange={(e) => handleMechanicalTestChange(poleType, test.id, e)} onBlur={(e) => handleBlur(e, poleType, index)} placeholder="مثال: ۱۰۰" error={errors[`maxDispAt1_5x_${poleType}_${index}`]}/>
                                                <InputGroup label="تغییرمکان باقی‌مانده" unit="mm" name="residualDispAfterLoad" value={test.residualDispAfterLoad} onChange={(e) => handleMechanicalTestChange(poleType, test.id, e)} onBlur={(e) => handleBlur(e, poleType, index)} placeholder="مثال: ۸" error={errors[`residualDispAfterLoad_${poleType}_${index}`]}/>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="action-button" onClick={() => addMechanicalTest(poleType)} disabled={testsForType.length >= 3}>افزودن برگه آزمون</button>
                                </div>
                            )
                        })}
                    </Card>

                    <Card title="سایر پارامترهای امتیازآور"><InputGroup label="مدت گارانتی" unit="سال" name="warrantyYears" value={inputs.warrantyYears} onChange={handleChange} onBlur={handleBlur} placeholder="حداقل ۲ سال" error={errors.warrantyYears}/><InputGroup label="سابقه تولید" unit="سال" name="historyYears" value={inputs.historyYears} onChange={handleChange} onBlur={handleBlur} /><InputGroup label="ظرفیت تولید سالانه" unit="اصله" name="annualCapacity" value={inputs.annualCapacity} onChange={handleChange} onBlur={handleBlur} /><InputGroup label="طول عمر پایه" unit="سال" name="lifespanYears" value={inputs.lifespanYears} onChange={handleChange} onBlur={handleBlur} placeholder="حداقل ۴۰ سال" error={errors.lifespanYears}/></Card>
                    <Card title="۱۰. کیفیت خط تولید و دپو"><div className="card-content checkbox-container"><InputGroup label="" name="line" value={inputs.prodLineQuality.line} onChange={handleChange} type="checkbox" onBlur={handleBlur}>فضای مسقف برای خط تولید</InputGroup><InputGroup label="" name="materials" value={inputs.prodLineQuality.materials} onChange={handleChange} type="checkbox" onBlur={handleBlur}>فضای مسقف برای مصالح سنگی</InputGroup><InputGroup label="" name="processing" value={inputs.prodLineQuality.processing} onChange={handleChange} type="checkbox" onBlur={handleBlur}>فضای مسقف برای دپوی فرآوری</InputGroup></div></Card>
                    <Card title="پارامترهای تولید و حمل"><InputGroup label="۱۱. روش تولید" name="prodMethod" value={inputs.prodMethod} onChange={handleChange} type="select" onBlur={handleBlur}><option value="40">قالب باز و آرماتوربندی اتوماتیک</option><option value="30">قالب باز و آرماتوربندی دستی</option><option value="20">قالب بسته و آرماتوربندی اتوماتیک</option><option value="0">قالب بسته و آرماتوربندی دستی</option></InputGroup><InputGroup label="۱۲. نوع میکسر" name="mixerType" value={inputs.mixerType} onChange={handleChange} type="select" onBlur={handleBlur}><option value="40">دو محوره افقی (Twin-shaft)</option><option value="30">تک محوره افقی</option><option value="20">تیغه‌ای با محور قائم (Pan)</option></InputGroup><InputGroup label="۱۳. نفوذپذیری و دوام بتن" name="permeability" value={inputs.permeability} onChange={handleChange} type="select" onBlur={handleBlur}><option value="40">ارائه نتایج کامل (طبق بند)</option><option value="20">ارائه نتایج ناقص (طبق بند)</option><option value="0">عدم ارائه نتایج</option></InputGroup><InputGroup label="۱۴. مسافت حمل" name="transportDistance" value={inputs.transportDistance} onChange={handleChange} type="select" onBlur={handleBlur}><option value="40">تا ۲۵۰ کیلومتر</option><option value="30">۲۵۰ تا ۵۰۰ کیلومتر</option><option value="20">۵۰۰ تا ۷۵۰ کیلومتر</option><option value="10">۷۵۰ تا ۱۰۰۰ کیلومتر</option><option value="0">بیشتر از ۱۰۰۰ کیلومتر</option></InputGroup></Card>
                    <div className="actions-container"><button className="reset-button" onClick={handleReset}>بازنشانی</button></div>
                </div>
                <div className="results-container">
                    <div className="results-card">
                        <h2 className="total-score-label">امتیاز نهایی</h2><Gauge value={calculations.totalScore} />
                        <ul className="score-breakdown">
                            {Object.entries(calculations.scores).map(([key, value]) => (
                                <li key={key}>
                                    <span className="label">{scoreLabels[key]?.label || key}<span className="weight">({scoreLabels[key]?.weight}٪)</span></span>
                                    <span className="value">{(value as number).toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
