import { NextResponse } from 'next/server'
import { renderToBuffer, Font } from '@react-pdf/renderer'
import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

// Register Hind Siliguri font from Google Fonts CDN for 100% stable Bengali rendering
Font.register({
  family: 'Hind Siliguri',
  src: 'https://fonts.gstatic.com/s/hindsiliguri/v14/ijwTs5juQtsyLLR5jN4cxBEofJs.ttf'
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Hind Siliguri',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000',
    paddingBottom: 12,
  },
  logo: {
    height: 50,
    marginBottom: 8,
  },
  institutionName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    color: '#000000',
  },
  examName: {
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
    color: '#333333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    fontSize: 10,
    color: '#333333',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#666666',
    color: '#000000',
  },
  questionRow: {
    marginBottom: 10,
    paddingRight: 10,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  questionText: {
    fontSize: 11,
    lineHeight: 1.5,
    flex: 1,
    color: '#000000',
  },
  questionTextRtl: {
    fontSize: 13,
    lineHeight: 1.6,
    flex: 1,
    textAlign: 'right',
    color: '#000000',
    paddingRight: 10,
  },
  marks: {
    fontSize: 10,
    color: '#444444',
    marginLeft: 10,
  },
  difficulty: {
    fontSize: 7,
    color: '#888888',
    marginLeft: 6,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 20,
    marginTop: 4,
    width: '100%',
  },
  optionText: {
    fontSize: 10,
    width: '50%', // Grid of 2x2 options
    marginBottom: 3,
    color: '#222222',
  },
  optionTextRtl: {
    fontSize: 12,
    width: '50%',
    marginBottom: 3,
    color: '#222222',
    textAlign: 'right',
    paddingRight: 10,
  },
  writtenSpace: {
    height: 45,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#dddddd',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#777777',
  },
})

const translateDifficulty = (diff: string) => {
  switch (diff) {
    case 'easy': return 'সহজ'
    case 'medium': return 'মাঝারি'
    case 'hard': return 'কঠিন'
    default: return diff
  }
}

const QuestionPaper = ({ questions, header, logoBase64 }: {
  questions: any[]
  header: any
  logoBase64: string | null
}) => {
  const mcqQuestions = questions.filter((q: any) => q.type === 'mcq')
  const writtenQuestions = questions.filter((q: any) => q.type === 'written')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          {logoBase64 && <Image src={logoBase64} style={styles.logo} />}
          <Text style={styles.institutionName}>{header.institution_name || header.institutionName || 'মাদ্রাসা প্রশ্নব্যাংক'}</Text>
          <Text style={styles.examName}>{header.exam_name || header.examName || ''}</Text>
          <View style={styles.infoRow}>
            <Text>তারিখ: {header.exam_date || header.examDate || '___'}</Text>
            <Text>সময়: {header.time_allowed || header.examTime || '___'}</Text>
            <Text>মোট নম্বর: {header.total_marks || header.totalMarks || '___'}</Text>
          </View>
        </View>

        {/* MCQ Section */}
        {mcqQuestions.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>বহুনির্বাচনী প্রশ্ন (MCQ)</Text>
            {mcqQuestions.map((q: any, index: number) => {
              const isRtl = ['arabic', 'farsi', 'urdu'].includes(q.language)
              return (
                <View key={q.id || index} style={styles.questionRow}>
                  <View style={styles.questionHeader}>
                    <Text style={isRtl ? styles.questionTextRtl : styles.questionText}>
                      {index + 1}. {q.question_text}
                    </Text>
                    <Text style={styles.marks}>[মান: {q.marks || 1}]</Text>
                  </View>
                  {q.options && (
                    <View style={styles.optionsContainer}>
                      <Text style={isRtl ? styles.optionTextRtl : styles.optionText}>ক. {q.options.a}</Text>
                      <Text style={isRtl ? styles.optionTextRtl : styles.optionText}>খ. {q.options.b}</Text>
                      <Text style={isRtl ? styles.optionTextRtl : styles.optionText}>গ. {q.options.c}</Text>
                      <Text style={isRtl ? styles.optionTextRtl : styles.optionText}>ঘ. {q.options.d}</Text>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        )}

        {/* Written Section */}
        {writtenQuestions.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>লিখিত প্রশ্ন</Text>
            {writtenQuestions.map((q: any, index: number) => {
              const isRtl = ['arabic', 'farsi', 'urdu'].includes(q.language)
              return (
                <View key={q.id || index} style={styles.questionRow}>
                  <View style={styles.questionHeader}>
                    <Text style={isRtl ? styles.questionTextRtl : styles.questionText}>
                      {mcqQuestions.length + index + 1}. {q.question_text}
                    </Text>
                    <Text style={styles.marks}>[মান: {q.marks || 5}]</Text>
                  </View>
                  <View style={styles.writtenSpace} />
                </View>
              )
            })}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>মাদ্রাসা প্রশ্নব্যাংক</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `পৃষ্ঠা: ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { questions, header, headerInfo } = body
    
    // Resolve header payloads robustly for both manual and auto modes
    const finalHeader = header || headerInfo || {}

    // Fetch logo as base64 if provided
    let logoBase64: string | null = null
    const logoUrl = finalHeader.logo_url || finalHeader.logoUrl
    if (logoUrl) {
      try {
        const response = await fetch(logoUrl)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64 = buffer.toString('base64')
        const contentType = response.headers.get('content-type') || 'image/jpeg'
        logoBase64 = `data:${contentType};base64,${base64}`
      } catch (err) {
        console.error('Error fetching logo:', err)
      }
    }

    const pdfBuffer = await renderToBuffer(
      <QuestionPaper questions={questions} header={finalHeader} logoBase64={logoBase64} />
    )

    const uint8 = new Uint8Array(pdfBuffer)

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="question-paper.pdf"',
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
