const PDFDocument = require('pdfkit');

// Mock temporário em memória
const mockResume = {
  id: "123",
  user_id: "user_teste",
  current_step: 1,
  full_name: "Fulano de Tal",
  job_title: "Desenvolvedor Full Stack Sênior",
  phone: "(11) 99999-9999",
  email: "fulano@email.com",
  linkedin_url: "https://linkedin.com/in/fulano",
  city: "São Paulo",
  state: "SP",
  skills: "React, Node.js, TypeScript, PostgreSQL, AWS, Docker, Arquitetura de Software",
  languages: "Inglês Avançado, Espanhol Intermediário",
  summary: "Profissional com mais de 6 anos de experiência em engenharia de software e liderança técnica. Especialista em construir sistemas distribuídos, microsserviços escaláveis e produtos digitais orientados a alta performance e métricas de negócio.",
  template_id: "harvard", // harvard | modern_tech | executive | compact | minimal_swiss
  primary_color: "#1F4E79",
  is_paid: false,
  payment_id: null,
  experiences: [
    { companyName: "Tech Solutions Inc.", position: "Especialista / Tech Lead", jobDescription: "Liderança de time multidisciplinar de 8 engenheiros, reduzindo latência da API em 45% e liderando migração de monolito para Kubernetes na AWS com 99.99% de SLA." },
    { companyName: "Inovação Digital Labs", position: "Desenvolvedor Full Stack Pleno", jobDescription: "Desenvolvimento de dashboards analíticos e APIs REST com Node.js e React, atendendo a mais de 200 mil usuários ativos mensais com pipelines CI/CD automatizados." }
  ],
  education: [
    { institution: "Universidade de São Paulo (USP)", degree: "Graduação", courseName: "Ciência da Computação", endYear: "2022" },
    { institution: "FIAP", degree: "Pós-Graduação / MBA", courseName: "Engenharia e Arquitetura de Software", endYear: "2024" }
  ]
};

exports.mockResume = mockResume;

exports.getResume = async (req, res) => {
  return res.json(mockResume);
};

exports.updateResumeFields = async (req, res) => {
  Object.assign(mockResume, req.body);
  return res.json({ message: 'Progresso salvo com sucesso!', data: mockResume });
};

exports.addExperience = async (req, res) => {
  mockResume.experiences.push(req.body);
  return res.status(201).json(req.body);
};

exports.deleteExperience = async (req, res) => {
  mockResume.experiences = mockResume.experiences.filter((_, idx) => idx.toString() !== req.params.experienceId);
  return res.status(204).send();
};

exports.addEducation = async (req, res) => {
  mockResume.education.push(req.body);
  return res.status(201).json(req.body);
};

// ========================================================================
// 5 MOTORES DE LAYOUT PROFISSIONAIS (Padrão Harvard, Tech, Executivo, etc)
// ========================================================================

const TEMPLATE_CONFIGS = {
  // 1. Harvard / Strict ATS: Clássico acadêmico, fonte serifada, cabeçalho centralizado, divisórias nítidas
  harvard: {
    id: 'harvard',
    name: 'Harvard Clássico (ATS Ouro)',
    fontBold: 'Times-Bold',
    fontName: 'Times-Roman',
    fontItalic: 'Times-Italic',
    headerAlign: 'center',
    margin: 45,
    nameSize: 20,
    sectionTitleSize: 11,
    bodySize: 10,
    showUnderlineSections: true,
    allCapsTitles: true,
    dividerColor: '#222222',
    headingColorMode: 'primary' // usa primary_color
  },
  // 2. Modern Tech (Linear / Vercel): Sans moderno, alinhado à esquerda, visual de engenharia
  modern_tech: {
    id: 'modern_tech',
    name: 'Moderno Tech (Startups / Dev)',
    fontBold: 'Helvetica-Bold',
    fontName: 'Helvetica',
    fontItalic: 'Helvetica-Oblique',
    headerAlign: 'left',
    margin: 40,
    nameSize: 22,
    sectionTitleSize: 11,
    bodySize: 9.5,
    showUnderlineSections: true,
    allCapsTitles: true,
    dividerColor: '#e0ded9',
    headingColorMode: 'accent'
  },
  // 3. Executivo (McKinsey / BCG): Elegante, espaçado, foco em liderança e resumo
  executive: {
    id: 'executive',
    name: 'Executivo & Gestão (C-Level)',
    fontBold: 'Times-Bold',
    fontName: 'Times-Roman',
    fontItalic: 'Times-Italic',
    headerAlign: 'center',
    margin: 50,
    nameSize: 22,
    sectionTitleSize: 12,
    bodySize: 10,
    showUnderlineSections: false,
    allCapsTitles: true,
    dividerColor: '#cccccc',
    headingColorMode: 'accent'
  },
  // 4. Compacto 1-Página (Alta Densidade Europeu): Margens curtas para caber muito conteúdo
  compact: {
    id: 'compact',
    name: 'Compacto 1-Página (Alta Densidade)',
    fontBold: 'Helvetica-Bold',
    fontName: 'Helvetica',
    fontItalic: 'Helvetica-Oblique',
    headerAlign: 'left',
    margin: 35,
    nameSize: 19,
    sectionTitleSize: 10.5,
    bodySize: 9,
    showUnderlineSections: true,
    allCapsTitles: true,
    dividerColor: '#cccccc',
    headingColorMode: 'accent'
  },
  // 5. Minimalista Suíço (Design & Produto): Tipografia pura, ritmo arejado e limpo
  minimal_swiss: {
    id: 'minimal_swiss',
    name: 'Minimalista Suíço (Clean Design)',
    fontBold: 'Helvetica-Bold',
    fontName: 'Helvetica',
    fontItalic: 'Helvetica-Oblique',
    headerAlign: 'left',
    margin: 48,
    nameSize: 21,
    sectionTitleSize: 11,
    bodySize: 9.5,
    showUnderlineSections: false,
    allCapsTitles: false,
    dividerColor: '#eeeeee',
    headingColorMode: 'primary'
  }
};

exports.downloadPDF = async (req, res) => {
  try {
    // 1. Extrai os dados mesclando mock e possíveis queries enviadas pelo frontend
    const templateId = req.query.template_id || mockResume.template_id || 'harvard';
    const primaryColor = req.query.primary_color || mockResume.primary_color || '#1F4E79';

    const cfg = TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS.harvard;

    const resumeData = {
      full_name: req.query.full_name || mockResume.full_name || "Fulano de Tal",
      job_title: req.query.job_title || mockResume.job_title || "Desenvolvedor Full Stack",
      phone: req.query.phone || mockResume.phone || "(11) 99999-9999",
      email: req.query.email || mockResume.email || "fulano@email.com",
      city: req.query.city || mockResume.city || "São Paulo",
      state: req.query.state || mockResume.state || "SP",
      linkedin_url: req.query.linkedin_url || mockResume.linkedin_url || "https://linkedin.com",
      skills: req.query.skills || mockResume.skills || "",
      languages: req.query.languages || mockResume.languages || "",
      summary: req.query.summary || mockResume.summary || "",
      experiences: mockResume.experiences || [],
      education: mockResume.education || []
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/pdf');
    const safeTitle = (resumeData.full_name || 'Curriculo').replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="Curriculo_${safeTitle}_${cfg.id}.pdf"`);

    const doc = new PDFDocument({ 
      margin: cfg.margin, 
      size: 'A4', 
      autoFirstPage: true 
    });
    
    doc.pipe(res);

    const titleColor = cfg.headingColorMode === 'accent' ? primaryColor : '#111827';
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - (cfg.margin * 2);

    // =================================================================
    // 1. CABEÇALHO DO CANDIDATO
    // =================================================================
    doc.fontSize(cfg.nameSize)
       .font(cfg.fontBold)
       .fillColor(titleColor)
       .text(resumeData.full_name.toUpperCase(), { align: cfg.headerAlign, lineGap: 2 });

    if (resumeData.job_title) {
      doc.fontSize(cfg.nameSize * 0.58)
         .font(cfg.fontItalic)
         .fillColor('#4b5563')
         .text(resumeData.job_title, { align: cfg.headerAlign });
    }

    doc.moveDown(0.4);

    // Linha de contatos unificada
    const locationStr = (resumeData.city && resumeData.state) ? `${resumeData.city}, ${resumeData.state}` : '';
    const contactParts = [locationStr, resumeData.phone, resumeData.email, resumeData.linkedin_url].filter(Boolean);
    
    doc.fontSize(8.5)
       .font(cfg.fontName)
       .fillColor('#6b7280')
       .text(contactParts.join('  •  '), { align: cfg.headerAlign });

    doc.moveDown(0.8);

    // Divisória do Cabeçalho
    doc.moveTo(cfg.margin, doc.y)
       .lineTo(pageWidth - cfg.margin, doc.y)
       .strokeColor(cfg.dividerColor)
       .lineWidth(0.75)
       .stroke();
    
    doc.moveDown(1);

    // Helper para Seções com Linha Elegante
    const renderSectionHeader = (title) => {
      doc.fontSize(cfg.sectionTitleSize)
         .font(cfg.fontBold)
         .fillColor(titleColor)
         .text(cfg.allCapsTitles ? title.toUpperCase() : title);

      if (cfg.showUnderlineSections) {
        doc.moveDown(0.15);
        doc.moveTo(cfg.margin, doc.y)
           .lineTo(pageWidth - cfg.margin, doc.y)
           .strokeColor(cfg.dividerColor)
           .lineWidth(0.5)
           .stroke();
      }
      doc.moveDown(0.5);
    };

    // =================================================================
    // 2. RESUMO PROFISSIONAL
    // =================================================================
    if (resumeData.summary) {
      renderSectionHeader('Resumo Profissional');
      doc.fontSize(cfg.bodySize)
         .font(cfg.fontName)
         .fillColor('#2d3139')
         .text(resumeData.summary, { align: 'justify', lineGap: 2 });
      doc.moveDown(1);
    }

    // =================================================================
    // 3. EXPERIÊNCIA PROFISSIONAL
    // =================================================================
    if (resumeData.experiences && resumeData.experiences.length > 0) {
      renderSectionHeader('Experiência Profissional');

      resumeData.experiences.forEach((exp) => {
        const company = exp.companyName || exp.company_name || 'Empresa';
        const position = exp.position || 'Cargo';
        const desc = exp.jobDescription || exp.description || '';

        // Linha 1: Empresa (Negrito) + Cargo (Itálico)
        doc.fontSize(cfg.bodySize + 1)
           .font(cfg.fontBold)
           .fillColor('#111827')
           .text(company, { continued: true })
           .font(cfg.fontItalic)
           .fillColor('#4b5563')
           .text(` — ${position}`);

        doc.moveDown(0.2);

        // Linha 2: Atividades com recuo limpo
        if (desc) {
          doc.fontSize(cfg.bodySize)
             .font(cfg.fontName)
             .fillColor('#374151')
             .text(desc, { align: 'justify', lineGap: 1.8 });
        }

        doc.moveDown(0.7);
      });

      doc.moveDown(0.3);
    }

    // =================================================================
    // 4. FORMAÇÃO ACADÊMICA
    // =================================================================
    if (resumeData.education && resumeData.education.length > 0) {
      renderSectionHeader('Formação Acadêmica');

      resumeData.education.forEach((edu) => {
        const course = edu.courseName || edu.course || 'Curso';
        const degree = edu.degree || 'Graduação';
        const inst = edu.institution || 'Instituição';
        const year = edu.endYear || edu.year || '';

        doc.fontSize(cfg.bodySize + 0.5)
           .font(cfg.fontBold)
           .fillColor('#111827')
           .text(`${course} (${degree})`, { continued: true })
           .font(cfg.fontName)
           .fillColor('#6b7280')
           .text(year ? `  •  ${year}` : '');

        doc.fontSize(cfg.bodySize * 0.95)
           .font(cfg.fontName)
           .fillColor('#4b5563')
           .text(inst);

        doc.moveDown(0.5);
      });

      doc.moveDown(0.5);
    }

    // =================================================================
    // 5. COMPETÊNCIAS E IDIOMAS (Keywords ATS)
    // =================================================================
    if (resumeData.skills || resumeData.languages) {
      renderSectionHeader('Competências & Idiomas');

      if (resumeData.skills) {
        doc.fontSize(cfg.bodySize)
           .font(cfg.fontBold)
           .fillColor('#111827')
           .text('Habilidades Técnicas: ', { continued: true })
           .font(cfg.fontName)
           .fillColor('#374151')
           .text(resumeData.skills, { lineGap: 1.5 });
      }

      if (resumeData.languages) {
        doc.moveDown(0.3);
        doc.fontSize(cfg.bodySize)
           .font(cfg.fontBold)
           .fillColor('#111827')
           .text('Idiomas e Certificações: ', { continued: true })
           .font(cfg.fontName)
           .fillColor('#374151')
           .text(resumeData.languages, { lineGap: 1.5 });
      }
    }

    doc.end();

  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    if (!res.headersSent) res.status(500).json({ error: 'Erro ao compilar PDF.' });
  }
};
