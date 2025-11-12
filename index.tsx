import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// --- Type Definitions ---
type PoleTest = {
    id: number;
    sandFinenessModulus: string;
    sandClayImpurity: string;
    gravelClayImpurity: string;
    sandValue: string;
    actualFailureStrength: string;
    maxDispAt1_5x: string;
    residualDispAfterLoad: string;
};

// --- Helper Components ---
const Gauge = ({ value }) => {
    const min = 0;
    const max = 100;
    const clampedValue = Math.max(min, Math.min(value, max));
    const percentage = (clampedValue - min) / (max - min);
    const angle = 180 * percentage;
    const circumference = Math.PI * 90;
    const dashArray = `${(circumference * angle) / 180} ${circumference}`;

    const getColor = (val) => {
        if (val < 50) return 'var(--danger-color)';
        if (val < 80) return 'var(--warning-color)';
        return 'var(--success-color)';
    };
    
    const color = getColor(clampedValue);

    return (
        <div className="gauge-container">
            <svg width="200" height="100" viewBox="0 0 200 100">
                <path className="gauge-background" d="M 10 100 A 90 90 0 0 1 190 100" />
                <path className="gauge-arc" d="M 10 100 A 90 90 0 0 1 190 100" stroke={color} strokeDasharray={dashArray} />
                <text x="100" y="90" textAnchor="middle" className="gauge-text">
                    {value.toFixed(2)}
                </text>
            </svg>
        </div>
    );
};

// FIX: Pass onBlur to select and checkbox inputs.
const InputGroup = ({ label, name, value, onChange, onBlur, type = "number", step = "any", children = null, unit = '', placeholder = '', error = null }) => (
    <div className="input-group">
        <label htmlFor={name}>{label} {unit && `(${unit})`}</label>
        {type === "select" ? (
            <select id={name} name={name} value={value} onChange={onChange} onBlur={onBlur}>
                {children}
            </select>
        ) : type === "checkbox" ? (
             <div className="checkbox-group">
                <input id={name} type="checkbox" name={name} checked={value} onChange={onChange} onBlur={onBlur} />
                {/* We move the label text here for checkbox alignment */}
             </div>
        ) : (
            <input id={name} type={type} name={name} value={value} onChange={onChange} onBlur={onBlur} step={step} placeholder={placeholder} className={error ? 'error' : ''}/>
        )}
        {error && <span className="error-message">{error}</span>}
    </div>
);


const Card = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <details className="card" open>
        <summary>{title}</summary>
        <div className="card-content">
            {children}
        </div>
    </details>
);


// --- Main Application ---
const App = () => {
    const [header, setHeader] = useState({
        company: '',
        tender: '',
        date: ''
    });

    const [poleTests, setPoleTests] = useState<PoleTest[]>([{ 
        id: 1, 
        sandFinenessModulus: '', sandClayImpurity: '', gravelClayImpurity: '', sandValue: '',
        actualFailureStrength: '', maxDispAt1_5x: '', residualDispAfterLoad: ''
    }]);

    const [inputs, setInputs] = useState({
        // Test Parameters
        nominalStrength: '',
        poleLength: '',
        // Water Quality
        suspendedSolids: '',
        dissolvedSolids: '',
        chlorideIons: '',
        sulfateIons: '',
        alkaliEquivalent: '',
        waterPH: '',
        // Operator Satisfaction
        sat_quality: '', sat_stability: '', sat_performance: '', sat_commitment: '', sat_disposal: '',
        // General Specs
        warrantyYears: '', historyYears: '', annualCapacity: '', lifespanYears: '',
        // Selects & Checkboxes
        prodLineQuality: {
            line: false,
            materials: false,
            processing: false
        },
        prodMethod: 40,
        mixerType: 40,
        permeability: 40,
        transportDistance: 40,
    });
    
    const [errors, setErrors] = useState({});

    // --- Handlers ---
    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHeader(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
             const { checked } = e.target as HTMLInputElement;
             setInputs(prev => ({
                ...prev,
                prodLineQuality: {
                    ...prev.prodLineQuality,
                    [name]: checked
                }
             }));
        } else {
            setInputs(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) {
            validateField(name, value);
        }
    };

    const handlePoleTestChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const updatedTests = [...poleTests];
        updatedTests[index] = { ...updatedTests[index], [name]: value };
        setPoleTests(updatedTests);

        const errorKey = `${name}_${index}`;
        if (errors[errorKey]) {
            validateField(name, value, index);
        }
    };
    
    const addPoleTest = () => {
        if (poleTests.length < 6) {
            setPoleTests(prev => [...prev, { id: Date.now(), sandFinenessModulus: '', sandClayImpurity: '', gravelClayImpurity: '', sandValue: '', actualFailureStrength: '', maxDispAt1_5x: '', residualDispAfterLoad: ''}]);
        }
    };
    
    const removePoleTest = (id: number) => {
        setPoleTests(prev => prev.filter(test => test.id !== id));
    };

    // --- Validation ---
    const validationSchema = {
        sandFinenessModulus: { min: 2.3, max: 3.1, message: "باید بین ۲.۳ و ۳.۱ باشد" },
        sandClayImpurity: { max: 2, message: "باید کمتر از ۲٪ باشد" },
        gravelClayImpurity: { max: 3, message: "باید کمتر از ۳٪ باشد" },
        sandValue: { min: 75, message: "باید بیشتر از ۷۵٪ باشد" },
        suspendedSolids: { max: 1000, message: "باید کمتر از ۱۰۰۰ باشد" },
        dissolvedSolids: { max: 1000, message: "باید کمتر از ۱۰۰۰ باشد" },
        chlorideIons: { max: 500, message: "باید کمتر از ۵۰۰ باشد" },
        sulfateIons: { max: 1000, message: "باید کمتر از ۱۰۰۰ باشد" },
        alkaliEquivalent: { max: 600, message: "باید کمتر از ۶۰۰ باشد" },
        waterPH: { min: 5.5, max: 8.5, message: "باید بین ۵.۵ و ۸.۵ باشد" },
        sat_quality: { min:0, max: 8, message: "باید بین ۰ و ۸ باشد" },
        sat_stability: { min:0, max: 8, message: "باید بین ۰ و ۸ باشد" },
        sat_performance: { min:0, max: 8, message: "باید بین ۰ و ۸ باشد" },
        sat_commitment: { min:0, max: 8, message: "باید بین ۰ و ۸ باشد" },
        sat_disposal: { min:0, max: 8, message: "باید بین ۰ و ۸ باشد" },
        warrantyYears: { min: 2, message: "حداقل ۲ سال" },
        lifespanYears: { min: 40, message: "حداقل ۴۰ سال" },
    };

    const validateField = (name, value, index = -1) => {
        const rule = validationSchema[name];
        const key = index > -1 ? `${name}_${index}` : name;
        if (!rule) return;
        
        const numValue = parseFloat(value);
        let error = null;

        if (value === '') { // Don't validate empty fields until blur
             setErrors(prev => ({ ...prev, [key]: null }));
             return;
        }

        if (isNaN(numValue)) {
            error = "مقدار باید عددی باشد";
        } else if (rule.min !== undefined && numValue < rule.min) {
            error = rule.message || `مقدار باید حداقل ${rule.min} باشد`;
        } else if (rule.max !== undefined && numValue > rule.max) {
            error = rule.message || `مقدار باید حداکثر ${rule.max} باشد`;
        }
        setErrors(prev => ({ ...prev, [key]: error }));
    };

    const handleBlur = (e, index = -1) => {
        validateField(e.target.name, e.target.value, index);
    };

    // --- Calculations ---
    const calculations = useMemo(() => {
        const scores: Record<string, number> = {};
        const getNum = (val) => parseFloat(String(val)) || 0;

        // 1. کیفیت مصالح سنگی (Averaged)
        const stoneScores = poleTests.map(test => {
            const score1a = Math.min(20, Math.max(0, 50 * (Math.abs(getNum(test.sandFinenessModulus) - 2.7) - 0.4)));
            const score1b = Math.min(5, Math.max(0, 500 * (0.02 - getNum(test.sandClayImpurity) / 100)));
            const score1c = Math.min(5, Math.max(0, 250 * (0.03 - getNum(test.gravelClayImpurity) / 100)));
            const score1d = Math.min(10, Math.max(0, 100 * (getNum(test.sandValue) / 100 - 0.75)));
            return (60 + score1a + score1b + score1c + score1d);
        });
        const avgStoneScore = stoneScores.reduce((sum, s) => sum + s, 0) / (stoneScores.length || 1);
        scores.stoneQuality = avgStoneScore * 0.15;


        // 2. کیفیت آب مصرفی
        const score2a = Math.min(5, Math.max(0, 0.01 * (1000 - getNum(inputs.suspendedSolids))));
        const score2b = Math.min(5, Math.max(0, 0.01 * (1000 - getNum(inputs.dissolvedSolids))));
        const score2c = Math.min(5, Math.max(0, 0.02 * (500 - getNum(inputs.chlorideIons))));
        const score2d = Math.min(5, Math.max(0, 0.01 * (1000 - getNum(inputs.sulfateIons))));
        const score2e = Math.min(5, Math.max(0, 0.0125 * (600 - getNum(inputs.alkaliEquivalent))));
        const score2f = Math.min(15, Math.max(0, 10 * (1.5 - Math.abs(getNum(inputs.waterPH) - 7))));
        scores.waterQuality = (60 + score2a + score2b + score2c + score2d + score2e + score2f) * 0.10;
        
        // 3. میزان رضایت بهره بردار
        const sat_avg = (getNum(inputs.sat_quality) + getNum(inputs.sat_stability) + getNum(inputs.sat_performance) + getNum(inputs.sat_commitment) + getNum(inputs.sat_disposal)) / 5;
        scores.satisfaction = (60 + sat_avg * 5) * 0.05;
        
        // 4. حد گسیختگی پایه (Averaged)
        const failureLimitScores = poleTests.map(test => {
            const nominalStrength = getNum(inputs.nominalStrength) || 1;
            if (getNum(test.actualFailureStrength) === 0) return 60; // Base score for empty input
            const failureRatio = getNum(test.actualFailureStrength) / (nominalStrength * 2);
            const score = Math.max(0, 80 * (failureRatio - 1));
            return (60 + score);
        });
        const avgFailureLimitScore = failureLimitScores.reduce((sum, s) => sum + s, 0) / (failureLimitScores.length || 1);
        scores.failureLimit = avgFailureLimitScore * 0.10;

        // 5. مقدار تغییر مکان باقی مانده (Averaged)
        const residualDispScores = poleTests.map(test => {
            if (getNum(test.maxDispAt1_5x) === 0) return 60; // Base score for empty input
            const maxDisp = getNum(test.maxDispAt1_5x);
            const residualDisp = getNum(test.residualDispAfterLoad);
            const residualPercentage = (residualDisp / maxDisp) * 100;
            const score = Math.max(0, 8 * (10 - residualPercentage));
            return (60 + score);
        });
        const avgResidualDispScore = residualDispScores.reduce((sum, s) => sum + s, 0) / (residualDispScores.length || 1);
        scores.residualDisp = avgResidualDispScore * 0.05;


        // 6. مدت گارانتی
        const score6 = Math.max(0, 40 * (getNum(inputs.warrantyYears) - 2));
        scores.warranty = (60 + score6) * 0.03;

        // 7. سابقه ی تولید
        const score7 = Math.max(0, 2 * getNum(inputs.historyYears));
        scores.history = (60 + score7) * 0.03;

        // 8. ظرفیت تولید
        const score8 = Math.max(0, 0.004 * getNum(inputs.annualCapacity));
        scores.capacity = (60 + score8) * 0.03;

        // 9. طول عمر پایه
        const score9 = Math.max(0, 2 * (getNum(inputs.lifespanYears) - 40));
        scores.lifespan = (60 + score9) * 0.05;

        // 10. کیفیت خط تولید و دپو
        let score10 = 0;
        const { line, materials, processing } = inputs.prodLineQuality;
        if (line && materials && processing) {
            score10 = 40;
        } else if (line && (materials || processing)) {
            score10 = 20;
        }
        scores.prodLineQuality = (60 + score10) * 0.05;
        
        // 11. روش تولید
        scores.prodMethod = (60 + getNum(inputs.prodMethod)) * 0.13;
        
        // 12. نوع میکسر
        scores.mixerType = (60 + getNum(inputs.mixerType)) * 0.05;

        // 13. نفوذپذیری و دوام بتن
        scores.permeability = (60 + getNum(inputs.permeability)) * 0.15;
        
        // 14. مسافت حمل
        scores.transportDistance = (60 + getNum(inputs.transportDistance)) * 0.03;

        const totalScore = Object.values(scores).reduce((sum, val) => sum + val, 0);
        
        return { ...scores, totalScore };
    }, [inputs, poleTests]);
    
    const scoreItems = [
        { key: 'stoneQuality', label: 'کیفیت مصالح سنگی', weight: 15 },
        { key: 'waterQuality', label: 'کیفیت آب مصرفی', weight: 10 },
        { key: 'satisfaction', label: 'میزان رضایت بهره بردار', weight: 5 },
        { key: 'failureLimit', label: 'حد گسیختگی پایه', weight: 10 },
        { key: 'residualDisp', label: 'مقدار تغییر مکان باقی مانده', weight: 5 },
        { key: 'warranty', label: 'مدت گارانتی', weight: 3 },
        { key: 'history', label: 'سابقه ی تولید', weight: 3 },
        { key: 'capacity', label: 'ظرفیت تولید', weight: 3 },
        { key: 'lifespan', label: 'طول عمر پایه', weight: 5 },
        { key: 'prodLineQuality', label: 'کیفیت خط تولید و دپو', weight: 5 },
        { key: 'prodMethod', label: 'روش تولید', weight: 13 },
        { key: 'mixerType', label: 'نوع میکسر', weight: 5 },
        { key: 'permeability', label: 'نفوذپذیری و دوام بتن', weight: 15 },
        { key: 'transportDistance', label: 'مسافت حمل', weight: 3 },
    ];


    return (
        <div className="app-container">
            <header>
                <h1>
                    محاسبه امتیاز فنی شرکت
                    <input name="company" value={header.company} onChange={handleHeaderChange} className="header-input" placeholder="..."/>
                    در مناقصه
                    <input name="tender" value={header.tender} onChange={handleHeaderChange} className="header-input" placeholder="..."/>
                    در تاریخ
                    <input name="date" value={header.date} onChange={handleHeaderChange} className="header-input" placeholder="..."/>
                </h1>
            </header>
            <main className="main-content">
                <div className="form-container">
                   <Card title="مشخصات پایه و آزمون">
                       <InputGroup label="مقاومت اسمی پایه" name="nominalStrength" value={inputs.nominalStrength} onChange={handleChange} onBlur={handleBlur} placeholder="مثال: 400" unit="kgf" error={errors.nominalStrength}/>
                       <InputGroup label="طول پایه" name="poleLength" value={inputs.poleLength} onChange={handleChange} onBlur={handleBlur} placeholder="مثال: 9" unit="متر" error={errors.poleLength}/>
                   </Card>
                   
                   <Card title="۱، ۴ و ۵. نتایج برگه آزمون پایه ها">
                        {poleTests.map((test, index) => (
                           <div key={test.id} className="pole-test-card">
                               <div className="pole-test-header">
                                   <h4>برگه آزمون پایه شماره {index + 1}</h4>
                                   {poleTests.length > 1 && <button onClick={() => removePoleTest(test.id)} className="remove-button">حذف</button>}
                               </div>
                               <div className="pole-test-inputs">
                                   <InputGroup label="ضریب نرمی ماسه" name="sandFinenessModulus" value={test.sandFinenessModulus} onChange={(e) => handlePoleTestChange(index, e)} onBlur={(e) => handleBlur(e, index)} placeholder="2.3 - 3.1" error={errors[`sandFinenessModulus_${index}`]} />
                                   <InputGroup label="ناخالصی ماسه" name="sandClayImpurity" value={test.sandClayImpurity} onChange={(e) => handlePoleTestChange(index, e)} onBlur={(e) => handleBlur(e, index)} unit="%" placeholder="کمتر از ۲٪" error={errors[`sandClayImpurity_${index}`]} />
                                   <InputGroup label="ناخالصی شن" name="gravelClayImpurity" value={test.gravelClayImpurity} onChange={(e) => handlePoleTestChange(index, e)} onBlur={(e) => handleBlur(e, index)} unit="%" placeholder="کمتر از ۳٪" error={errors[`gravelClayImpurity_${index}`]} />
                                   <InputGroup label="ارزش ماسه‌ای" name="sandValue" value={test.sandValue} onChange={(e) => handlePoleTestChange(index, e)} onBlur={(e) => handleBlur(e, index)} unit="%" placeholder="بیشتر از ۷۵٪" error={errors[`sandValue_${index}`]} />
                                   <InputGroup label="نیروی گسیختگی" name="actualFailureStrength" value={test.actualFailureStrength} onChange={(e) => handlePoleTestChange(index, e)} onBlur={(e) => handleBlur(e, index)} unit="kgf" placeholder="نیروی شکست نهایی" error={errors[`actualFailureStrength_${index}`]} />
                                   <InputGroup label="حداکثر تغییرمکان" name="maxDispAt1_5x" value={test.maxDispAt1_5x} onChange={(e) => handlePoleTestChange(index, e)} onBlur={(e) => handleBlur(e, index)} unit="mm" placeholder="در بار ۱.۵ برابر" error={errors[`maxDispAt1_5x_${index}`]}/>
                                   <InputGroup label="تغییرمکان باقیمانده" name="residualDispAfterLoad" value={test.residualDispAfterLoad} onChange={(e) => handlePoleTestChange(index, e)} onBlur={(e) => handleBlur(e, index)} unit="mm" placeholder="پس از حذف بار" error={errors[`residualDispAfterLoad_${index}`]}/>
                               </div>
                           </div>
                        ))}
                        <button onClick={addPoleTest} disabled={poleTests.length >= 6} className="action-button">افزودن برگه آزمون پایه</button>
                   </Card>
                   
                   <Card title="۲. کیفیت آب مصرفی">
                       <InputGroup label="ذرات جامد معلق" name="suspendedSolids" value={inputs.suspendedSolids} onChange={handleChange} onBlur={handleBlur} unit="ppm" placeholder="کمتر از ۱۰۰۰" error={errors.suspendedSolids} />
                       <InputGroup label="کل مواد محلول" name="dissolvedSolids" value={inputs.dissolvedSolids} onChange={handleChange} onBlur={handleBlur} unit="ppm" placeholder="کمتر از ۱۰۰۰" error={errors.dissolvedSolids} />
                       <InputGroup label="کل یون‌های کلرید" name="chlorideIons" value={inputs.chlorideIons} onChange={handleChange} onBlur={handleBlur} unit="ppm" placeholder="کمتر از ۵۰۰" error={errors.chlorideIons} />
                       <InputGroup label="کل یون‌های سولفات" name="sulfateIons" value={inputs.sulfateIons} onChange={handleChange} onBlur={handleBlur} unit="ppm" placeholder="کمتر از ۱۰۰۰" error={errors.sulfateIons} />
                       <InputGroup label="قلیایی معادل" name="alkaliEquivalent" value={inputs.alkaliEquivalent} onChange={handleChange} onBlur={handleBlur} unit="ppm" placeholder="کمتر از ۶۰۰" error={errors.alkaliEquivalent} />
                       <InputGroup label="PH آب" name="waterPH" value={inputs.waterPH} onChange={handleChange} onBlur={handleBlur} placeholder="5.5 - 8.5" error={errors.waterPH} />
                   </Card>
                   <Card title="۳. میزان رضایت بهره بردار">
                        <InputGroup label="کیفیت ساخت و عمل آوری" name="sat_quality" value={inputs.sat_quality} onChange={handleChange} onBlur={handleBlur} placeholder="۰ تا ۸" error={errors.sat_quality} />
                        <InputGroup label="چگونگی استقرار و جابجایی" name="sat_stability" value={inputs.sat_stability} onChange={handleChange} onBlur={handleBlur} placeholder="۰ تا ۸" error={errors.sat_stability} />
                        <InputGroup label="عملکرد در دوره بهره برداری" name="sat_performance" value={inputs.sat_performance} onChange={handleChange} onBlur={handleBlur} placeholder="۰ تا ۸" error={errors.sat_performance} />
                        <InputGroup label="انجام به موقع تعهدات" name="sat_commitment" value={inputs.sat_commitment} onChange={handleChange} onBlur={handleBlur} placeholder="۰ تا ۸" error={errors.sat_commitment} />
                        <InputGroup label="نحوه امحاء تولیدات مردود" name="sat_disposal" value={inputs.sat_disposal} onChange={handleChange} onBlur={handleBlur} placeholder="۰ تا ۸" error={errors.sat_disposal} />
                   </Card>
                     <Card title="۶ تا ۹. مشخصات عمومی">
                        <InputGroup label="مدت گارانتی تعویض" name="warrantyYears" value={inputs.warrantyYears} onChange={handleChange} onBlur={handleBlur} unit="سال" placeholder="حداقل ۲ سال" error={errors.warrantyYears} />
                        <InputGroup label="سابقه تولید" name="historyYears" value={inputs.historyYears} onChange={handleChange} onBlur={handleBlur} unit="سال" placeholder="مثال: ۱۰" error={errors.historyYears} />
                        <InputGroup label="ظرفیت تولید سالانه" name="annualCapacity" value={inputs.annualCapacity} onChange={handleChange} onBlur={handleBlur} unit="اصله" placeholder="مثال: ۵۰۰۰" error={errors.annualCapacity} />
                        <InputGroup label="طول عمر پایه" name="lifespanYears" value={inputs.lifespanYears} onChange={handleChange} onBlur={handleBlur} unit="سال" placeholder="حداقل ۴۰ سال" error={errors.lifespanYears} />
                    </Card>
                    <Card title="۱۰. کیفیت خط تولید و دپو">
                         <div className="card-content checkbox-container">
                             <div className="checkbox-group">
                                <input type="checkbox" id="line" name="line" checked={inputs.prodLineQuality.line} onChange={handleChange} />
                                <label htmlFor="line">فضای مسقف برای خط تولید</label>
                             </div>
                              <div className="checkbox-group">
                                <input type="checkbox" id="materials" name="materials" checked={inputs.prodLineQuality.materials} onChange={handleChange} />
                                <label htmlFor="materials">فضای مسقف برای مصالح سنگی</label>
                             </div>
                              <div className="checkbox-group">
                                <input type="checkbox" id="processing" name="processing" checked={inputs.prodLineQuality.processing} onChange={handleChange} />
                                <label htmlFor="processing">فضای مسقف برای دپوی فرآوری پایه‌ها</label>
                             </div>
                         </div>
                    </Card>
                     {/* FIX: Add missing onBlur prop */}
                     <Card title="۱۱. روش تولید">
                         <InputGroup label="انتخاب روش" name="prodMethod" value={inputs.prodMethod} type="select" onChange={handleChange} onBlur={handleBlur}>
                            <option value={40}>بتن ریزی در قالب باز و آرماتوربندی با دستگاه اتوماتیک</option>
                            <option value={30}>بتن ریزی در قالب باز و آرماتوربندی دستی</option>
                             <option value={20}>تزریق بتن در قالب بسته و آرماتوربندی با دستگاه اتوماتیک</option>
                            <option value={0}>تزریق بتن در قالب بسته</option>
                         </InputGroup>
                    </Card>
                     {/* FIX: Add missing onBlur prop */}
                     <Card title="۱۲. نوع میکسر">
                         <InputGroup label="انتخاب میکسر" name="mixerType" value={inputs.mixerType} type="select" onChange={handleChange} onBlur={handleBlur}>
                            <option value={40}>بچینگ با میکسر دو محور افقی</option>
                            <option value={30}>بچینگ با میکسر تک محور افقی</option>
                            <option value={20}>بچینگ با میکسر تیغه‌ای با محور قائم</option>
                         </InputGroup>
                    </Card>
                     {/* FIX: Add missing onBlur prop */}
                     <Card title="۱۳. نفوذپذیری و دوام بتن">
                         <InputGroup label="ارائه نتایج آزمایش" name="permeability" value={inputs.permeability} type="select" onChange={handleChange} onBlur={handleBlur}>
                            <option value={40}>ارائه نتایج کامل (آزمایش ۱ یا ۲ + دو آزمایش از ردیف ۳ تا ۶)</option>
                            <option value={20}>ارائه نتایج ناقص (آزمایش ۱ یا ۲ + یک آزمایش از ردیف ۵ و ۶)</option>
                            <option value={0}>عدم ارائه نتایج</option>
                         </InputGroup>
                    </Card>
                    {/* FIX: Add missing onBlur prop */}
                    <Card title="۱۴. مسافت حمل">
                         <InputGroup label="انتخاب مسافت" name="transportDistance" value={inputs.transportDistance} type="select" onChange={handleChange} onBlur={handleBlur}>
                            <option value={40}>تا ۲۵۰ کیلومتر</option>
                            <option value={30}>۲۵۰ تا ۵۰۰ کیلومتر</option>
                            <option value={20}>۵۰۰ تا ۷۵۰ کیلومتر</option>
                            <option value={10}>۷۵۰ تا ۱۰۰۰ کیلومتر</option>
                            <option value={0}>بیشتر از ۱۰۰۰ کیلومتر</option>
                         </InputGroup>
                    </Card>

                </div>
                <div className="results-container">
                    <div className="results-card">
                        <Gauge value={calculations.totalScore} />
                        <h2 className="total-score-label">امتیاز نهایی فنی</h2>
                        <ul className="score-breakdown">
                           {scoreItems.map(item => (
                               <li key={item.key}>
                                   <span className="label">{item.label} <span className="weight">(وزن: {item.weight}٪)</span></span>
                                   <span className="value">{(calculations[item.key] || 0).toFixed(2)}</span>
                               </li>
                           ))}
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);