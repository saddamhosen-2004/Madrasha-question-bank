'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [summary, setSummary] = useState({ valid: 0, invalid: 0 });
  const supabase = createClient();

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        jamat_name: 'উলা',
        kitab_name: 'নাহবেমীর',
        chapter_name: 'প্রথম অধ্যায়',
        type: 'mcq',
        language: 'bangla',
        question_text: 'কালেমা কত প্রকার?',
        option_a: '২',
        option_b: '৩',
        option_c: '৪',
        option_d: '৫',
        correct_answer: '৩',
        marks: 1,
        difficulty: 'easy'
      },
      {
        jamat_name: 'উলা',
        kitab_name: 'নাহবেমীর',
        chapter_name: 'প্রথম অধ্যায়',
        type: 'written',
        language: 'bangla',
        question_text: 'কালেমার প্রকারভেদ বিস্তারিত আলোচনা কর।',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: '',
        marks: 5,
        difficulty: 'medium'
      }
    ];

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'question_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setRows([]);
      setSummary({ valid: 0, invalid: 0 });
    }
  };

  const validateRow = (row: any) => {
    const errors: string[] = [];
    
    if (!row.jamat_name) errors.push('jamat_name missing');
    if (!row.kitab_name) errors.push('kitab_name missing');
    if (!row.chapter_name) errors.push('chapter_name missing');
    if (!row.question_text) errors.push('question_text missing');
    
    if (!['mcq', 'written'].includes(row.type)) {
       errors.push('type must be mcq or written');
    }

    if (!row.language) row.language = 'bangla';
    if (!['bangla', 'arabic', 'farsi', 'urdu'].includes(row.language)) {
      errors.push('invalid language');
    }

    if (!row.difficulty) row.difficulty = 'medium';
    if (!['easy', 'medium', 'hard'].includes(row.difficulty)) {
      errors.push('invalid difficulty');
    }

    if (row.type === 'mcq') {
      if (!row.option_a || !row.option_b || !row.option_c || !row.option_d) {
        errors.push('options a-d required for mcq');
      }
    }

    const marksNum = Number(row.marks);
    if (isNaN(marksNum) || marksNum <= 0) {
      errors.push('marks must be a positive number');
    } else {
      row.marks = marksNum;
    }

    return { ...row, errors, isValid: errors.length === 0 };
  };

  const handleParse = async () => {
    if (!file) return;
    setIsParsing(true);

    const processData = (data: any[]) => {
      let valid = 0;
      let invalid = 0;
      const processedRows = data.map(row => {
        const validated = validateRow(row);
        if (validated.isValid) valid++;
        else invalid++;
        return validated;
      });
      setRows(processedRows);
      setSummary({ valid, invalid });
      setIsParsing(false);
    };

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processData(results.data);
        }
      });
    } else if (file.name.endsWith('.xlsx')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        processData(json);
      };
      reader.readAsBinaryString(file);
    } else {
      alert('Only .csv and .xlsx files are supported');
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    const validRows = rows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setIsImporting(true);
    setProgress({ current: 0, total: validRows.length });

    try {
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];

        // Find or create jamat
        let { data: jamat } = await supabase
          .from('jamats')
          .select('id')
          .eq('name', row.jamat_name)
          .single();

        let jamatId = jamat?.id;
        if (!jamatId) {
          const { data: newJamat } = await supabase
            .from('jamats')
            .insert({ name: row.jamat_name })
            .select()
            .single();
          jamatId = newJamat?.id;
        }

        // Find or create kitab
        let { data: kitab } = await supabase
          .from('kitabs')
          .select('id')
          .eq('jamat_id', jamatId)
          .eq('name', row.kitab_name)
          .single();
        
        let kitabId = kitab?.id;
        if (!kitabId) {
           const { data: newKitab } = await supabase
            .from('kitabs')
            .insert({ name: row.kitab_name, jamat_id: jamatId })
            .select()
            .single();
          kitabId = newKitab?.id;
        }

        // Find or create chapter
        let { data: chapter } = await supabase
          .from('chapters')
          .select('id')
          .eq('kitab_id', kitabId)
          .eq('name', row.chapter_name)
          .single();
        
        let chapterId = chapter?.id;
        if (!chapterId) {
           const { data: newChapter } = await supabase
            .from('chapters')
            .insert({ name: row.chapter_name, kitab_id: kitabId })
            .select()
            .single();
          chapterId = newChapter?.id;
        }

        // Insert question
        const questionData = {
          chapter_id: chapterId,
          type: row.type,
          language: row.language,
          question_text: row.question_text,
          marks: row.marks,
          difficulty: row.difficulty,
        };

        const { data: insertedQuestion } = await supabase
          .from('questions')
          .insert(questionData)
          .select()
          .single();

        if (insertedQuestion && row.type === 'mcq') {
          await supabase.from('mcq_options').insert({
            question_id: insertedQuestion.id,
            option_a: row.option_a,
            option_b: row.option_b,
            option_c: row.option_c,
            option_d: row.option_d,
            correct_answer: row.correct_answer || ''
          });
        }

        setProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }

      alert('ইম্পোর্ট সফল হয়েছে!');
      setFile(null);
      setRows([]);
      setSummary({ valid: 0, invalid: 0 });
    } catch (error) {
      console.error('Import error:', error);
      alert('ইম্পোর্ট করার সময় ত্রুটি হয়েছে');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="page-content" style={{ padding: 0 }}>
      {/* Colorful Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #052e16 0%, #0f5d34 50%, #16a34a 100%)',
        padding: '32px 32px 28px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 8px 32px rgba(15,93,52,0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div style={{ position: 'absolute', right: '-30px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '100px', bottom: '-60px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>প্রশ্ন ব্যাংক ব্যবস্থাপনা</p>
          <h1 style={{ color: 'white', fontSize: '1.9rem', fontWeight: 800, margin: '0 0 6px' }}>বাল্ক ইম্পোর্ট</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', margin: 0 }}>CSV বা Excel ফাইলের মাধ্যমে একসাথে অনেক প্রশ্ন যুক্ত করুন</p>
        </div>
        <button 
          className="btn" 
          style={{ 
            position: 'relative', 
            zIndex: 1, 
            background: 'white', 
            color: 'var(--color-primary-dark)', 
            fontWeight: 700, 
            boxShadow: '0 4px 14px rgba(255,255,255,0.25)', 
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            cursor: 'pointer'
          }} 
          onClick={handleDownloadTemplate}
        >
          টেমপ্লেট ডাউনলোড করুন
        </button>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{
          border: '2px dashed var(--color-border)',
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          backgroundColor: '#fafbfc'
        }}>
          <input 
            type="file" 
            accept=".csv, .xlsx" 
            onChange={handleFileChange} 
            className="hidden" 
            id="file-upload" 
          />
          <label htmlFor="file-upload" className="btn btn-secondary" style={{ cursor: 'pointer', padding: '10px 20px' }}>
            ফাইল নির্বাচন করুন (.csv, .xlsx)
          </label>
          {file && (
            <div style={{ marginTop: '8px', color: 'var(--color-primary)' }}>
              📄 নির্বাচিত ফাইল: <strong>{file.name}</strong>
            </div>
          )}
        </div>
        
        {file && (
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleParse} 
              disabled={isParsing}
              className="btn btn-primary"
            >
              {isParsing ? 'পার্স করা হচ্ছে...' : 'পার্স করুন'}
            </button>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="badge badge-success">সঠিক: {summary.valid}</div>
              <div className="badge badge-danger">ভুল: {summary.invalid}</div>
            </div>
            
            {summary.valid > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isImporting && (
                  <span style={{ color: 'var(--color-text-muted)' }}>{progress.current} / {progress.total} প্রশ্ন import হয়েছে</span>
                )}
                <button 
                  onClick={handleImport} 
                  disabled={isImporting}
                  className="btn btn-primary"
                >
                  {isImporting ? 'ইম্পোর্ট করা হচ্ছে...' : 'ইম্পোর্ট শুরু করুন'}
                </button>
              </div>
            )}
          </div>

          <div className="table-wrap">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <th className="p-3">অবস্থা</th>
                  <th className="p-3">জামাত</th>
                  <th className="p-3">কিতাব</th>
                  <th className="p-3">অধ্যায়</th>
                  <th className="p-3">ধরন</th>
                  <th className="p-3">প্রশ্ন</th>
                  <th className="p-3">মার্কস</th>
                  <th className="p-3">ত্রুটি</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-b" style={{ backgroundColor: !row.isValid ? '#fdf2f2' : 'transparent', borderColor: 'var(--color-border)' }}>
                    <td className="p-3">
                      {row.isValid ? 
                        <span className="text-green-600 font-bold">✓</span> : 
                        <span className="text-red-600 font-bold">✗</span>
                      }
                    </td>
                    <td className="p-3">{row.jamat_name}</td>
                    <td className="p-3">{row.kitab_name}</td>
                    <td className="p-3">{row.chapter_name}</td>
                    <td className="p-3 uppercase">{row.type}</td>
                    <td className="p-3 truncate max-w-xs" title={row.question_text}>{row.question_text}</td>
                    <td className="p-3">{row.marks}</td>
                    <td className="p-3 text-red-600 text-xs" style={{ whiteSpace: 'normal', color: 'var(--color-danger)' }}>
                      {!row.isValid && row.errors.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
