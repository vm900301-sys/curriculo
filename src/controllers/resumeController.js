const PDFDocument = require('pdfkit');

// Mock temporário simulando dados do banco de dados
const mockResume = {
  id: "123",
  user_id: "user_teste",
  current_step: 1,
  full_name: "Fulano de Tal",
  job_title: "Desenvolvedor Full Stack",
  phone: "(11) 99999-9999",
  email: "fulano@email.com",
  linkedin_url: "https://linkedin.com/in/fulano",
  city: "São Paulo",
  state: "SP",
  skills: "React, Node.js, TypeScript, PostgreSQL, AWS, Docker",
  languages: "Inglês Avançado, Espanhol Intermediário",
  summary: "Profissional focado em soluções web com React e Node.js.",
  template_id: "minimal",
  primary_color: "#0070f3",
  is_paid: false,       // Controla se o download está liberado (após checkout/pix)
  payment_id: null,     // Rastreia o ID da transação no gateway (Mercado Pago, Stripe, Asaas)
  experiences: [
    { companyName: "Tech Solutions", position: "Dev Sênior", jobDescription: "Liderança técnica de equipe, arquitetura de microsserviços e migração de infraestrutura para nuvem." },
    { companyName: "Inovação Digital", position: "Dev Pleno", jobDescription: "Desenvolvimento de aplicações web responsivas e APIs utilizando ecossistema JavaScript/TypeScript." }
  ],
  education: [
    { institution: "Universidade de São Paulo (USP)", degree: "Graduação", courseName: "Ciência da Computação", endYear: "2022" },
    { institution: "FIAP", degree: "Pós-Graduação / MBA", courseName: "Arquitetura de Software", endYear: "2024" }
  ]
};

exports.mockResume = mockResume;

exports.getResume = async (req, res) => {
  return res.json(mockResume);
};

exports.updateResumeFields = async (req, res) => {
  console.log("Campos recebidos para atualizar:", req.body);
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

exports.downloadPDF = async (req, res) => {
  try {
    // TRAVA DE MONETIZAÇÃO (HTTP 402 Payment Required)
    if (!mockResume.is_paid) {
      return res.status(402).json({ 
        error: 'Pagamento necessário para liberar este download.',
        is_paid: false,
        price: 'R$ 9,90'
      });
    }

    // 1. Em um cenário real, você buscaria do banco de dados usando o ID.
    // Usamos o mockResume atualizado em memória:
    const resumeData = {
      full_name: mockResume.full_name || "Fulano de Tal",
      job_title: mockResume.job_title || "Desenvolvedor Full Stack Sênior",
      phone: mockResume.phone || "(11) 99999-9999",
      email: mockResume.email || "fulano@email.com",
      city: mockResume.city || "São Paulo",
      state: mockResume.state || "SP",
      linkedin_url: mockResume.linkedin_url || "https://linkedin.com",
      skills: mockResume.skills || "React, Node.js, TypeScript, PostgreSQL, AWS, Docker",
      languages: mockResume.languages || "Inglês Avançado, Espanhol Intermediário",
      summary: mockResume.summary || "Profissional focado em soluções web escaláveis com mais de 5 anos de experiência.",
      primary_color: mockResume.primary_color || "#0070f3",
      experiences: mockResume.experiences || [],
      education: mockResume.education || []
    };

    // 2. Configurações de layout do PDF
    const config = { fontBold: 'Helvetica-Bold', fontName: 'Helvetica', fontItalic: 'Helvetica-Oblique', margin: 50 };
    const primaryColor = resumeData.primary_color || '#0070f3';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="curriculo.pdf"');

    const doc = new PDFDocument({ margin: config.margin });
    doc.pipe(res);

    // --- CABEÇALHO (Nome, Cargo e Contatos) ---
    doc.fontSize(22).font(config.fontBold).fillColor(primaryColor).text(resumeData.full_name.toUpperCase());
    doc.fontSize(13).font(config.fontName).fillColor('#333333').text(resumeData.job_title);
    doc.moveDown(0.5);
    
    doc.fontSize(9).font(config.fontName).fillColor('#666666')
       .text(`Localização: ${resumeData.city} - ${resumeData.state} | Telefone: ${resumeData.phone}`);
    doc.text(`E-mail: ${resumeData.email} | LinkedIn: ${resumeData.linkedin_url}`);
    doc.moveDown(1);

    // Linha divisória
    doc.moveTo(config.margin, doc.y).lineTo(doc.page.width - config.margin, doc.y).stroke('#dddddd');
    doc.moveDown(1);

    // --- SEÇÃO: RESUMO PROFISSIONAL ---
    if (resumeData.summary) {
      doc.fontSize(12).font(config.fontBold).fillColor(primaryColor).text('RESUMO PROFISSIONAL');
      doc.moveDown(0.3);
      doc.fontSize(10).font(config.fontName).fillColor('#222222').text(resumeData.summary, { align: 'justify' });
      doc.moveDown(1.5);
    }

    // --- SEÇÃO: EXPERIÊNCIAS PROFISSIONAIS (LAÇO DINÂMICO) ---
    if (resumeData.experiences && resumeData.experiences.length > 0) {
      doc.fontSize(12).font(config.fontBold).fillColor(primaryColor).text('EXPERIÊNCIA PROFISSIONAL');
      doc.moveDown(0.5);

      resumeData.experiences.forEach((exp) => {
        doc.fontSize(11).font(config.fontBold).fillColor('#111118').text(exp.companyName || exp.company_name || 'Empresa');
        doc.fontSize(10).font(config.fontItalic).fillColor('#555555').text(exp.position || 'Cargo');
        doc.moveDown(0.2);
        if (exp.jobDescription || exp.description) {
          doc.fontSize(10).font(config.fontName).fillColor('#222222').text(exp.jobDescription || exp.description, { align: 'justify' });
        }
        doc.moveDown(1);
      });
      doc.moveDown(0.5);
    }

    // --- SEÇÃO: FORMAÇÃO ACADÊMICA (LAÇO DINÂMICO) ---
    if (resumeData.education && resumeData.education.length > 0) {
      doc.fontSize(12).font(config.fontBold).fillColor(primaryColor).text('FORMAÇÃO ACADÊMICA');
      doc.moveDown(0.5);

      resumeData.education.forEach((edu) => {
        doc.fontSize(11).font(config.fontBold).fillColor('#111118').text(`${edu.courseName || edu.course || 'Curso'} (${edu.degree || 'Grau'})`);
        doc.fontSize(10).font(config.fontName).fillColor('#555555').text(`${edu.institution} — Concluído em ${edu.endYear || edu.year || ''}`);
        doc.moveDown(0.8);
      });
      doc.moveDown(0.5);
    }

    // --- SEÇÃO: COMPETÊNCIAS E IDIOMAS ---
    if (resumeData.skills || resumeData.languages) {
      doc.fontSize(12).font(config.fontBold).fillColor(primaryColor).text('COMPETÊNCIAS E IDIOMAS');
      doc.moveDown(0.5);

      if (resumeData.skills) {
        doc.fontSize(10).font(config.fontBold).fillColor('#111118').text('Principais Habilidades: ', { continued: true })
           .font(config.fontName).fillColor('#222222').text(resumeData.skills);
      }
      
      if (resumeData.languages) {
        doc.moveDown(0.3);
        doc.fontSize(10).font(config.fontBold).fillColor('#111118').text('Idiomas e Certificados: ', { continued: true })
           .font(config.fontName).fillColor('#222222').text(resumeData.languages);
      }
    }

    doc.end();

  } catch (error) {
    console.error("Erro ao montar PDF:", error);
    if (!res.headersSent) res.status(500).json({ error: 'Erro de compilação do PDF.' });
  }
};
