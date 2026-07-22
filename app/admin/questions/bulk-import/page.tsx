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
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">বাল্ক ইম্পোর্ট</h1>
        <button onClick={handleDownloadTemplate} className="btn btn-secondary">টেমপ্লেট ডাউনলোড করুন</button>
      </div>

      <div className="card p-6 mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center flex flex-col items-center justify-center gap-4">
          <input 
            type="file" 
            accept=".csv, .xlsx" 
            onChange={handleFileChange} 
            className="hidden" 
            id="file-upload" 
          />
          <label htmlFor="file-upload" className="cursor-pointer bg-blue-50 text-blue-600 px-6 py-3 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors">
            ফাইল নির্বাচন করুন (.csv, .xlsx)
          </label>
          {file && (
            <div className="text-sm text-gray-600 font-medium">
              নির্বাচিত ফাইল: {file.name}
            </div>
          )}
        </div>
        
        {file && (
          <div className="mt-4 flex justify-end">
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
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-4">
              <div className="badge badge-success">সঠিক: {summary.valid}</div>
              <div className="badge badge-danger">ভুল: {summary.invalid}</div>
            </div>
            
            {summary.valid > 0 && (
              <div className="flex items-center gap-4">
                {isImporting && (
                  <span className="text-sm font-medium">{progress.current} / {progress.total} প্রশ্ন import হয়েছে</span>
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
              <thead className="bg-gray-50 border-b">
                <tr>
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
                  <tr key={idx} className={`border-b ${!row.isValid ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <td className="p-3">
                      {row.isValid ? 
                        <span className="text-green-600 font-bold">✓</span> : 
                        <span className="text-red-600 font-bold">✗</span>
                      }
                    </td>
                    <td className="p-3">{row.jamat_name}</td>
                    <td className="p-3">{row.kitab_name}</td>
                    <td className="p-3">{row.chapter_name}</td>
                    <td className="p-3">{row.type}</td>
                    <td className="p-3 truncate max-w-xs" title={row.question_text}>{row.question_text}</td>
                    <td className="p-3">{row.marks}</td>
                    <td className="p-3 text-red-600 text-xs">
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
