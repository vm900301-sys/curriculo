const { OpenAI } = require('openai');

// Inicializa o cliente OpenAI
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'sua_chave_da_openai_aqui') {
    return null;
  }
  return new OpenAI({ apiKey });
};

/**
 * Gerador de Resumo Profissional Inteligente (com Fallback Robusto)
 */
exports.generateSummary = async (req, res) => {
  try {
    const data = req.body || {};

    // 1. Extrai os dados enviados pelo frontend
    const jobTitle = data.jobTitle || 'Profissional';
    const fullName = data.fullName || 'Candidato';
    const cityState = (data.city && data.state) ? `em ${data.city}/${data.state}` : '';
    
    // Processa lista de experiências
    const exps = Array.isArray(data.experiences) ? data.experiences : [];
    const listaExperiencias = exps
      .filter(e => e.companyName || e.position)
      .map(e => `- ${e.position || 'Atuação'} na empresa ${e.companyName || 'Empresa'}: ${e.jobDescription || 'Atividades estratégicas da área.'}`)
      .join('\n');

    // Processa lista de formações
    const edus = Array.isArray(data.education) ? data.education : [];
    const listaFormacoes = edus
      .filter(e => e.institution || e.courseName)
      .map(e => `- ${e.degree || 'Formação'} em ${e.courseName || 'Curso'} pela ${e.institution || 'Instituição'}${e.endYear ? ` (${e.endYear})` : ''}`)
      .join('\n');

    const skills = data.skills || '';
    const languages = data.languages || '';

    const openai = getOpenAIClient();

    // 2. Se houver chave válida da OpenAI, chama o GPT-4o-mini
    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Você é um Tech Recruiter e especialista em RH. Escreva resumos profissionais magnéticos, em 1ª pessoa do singular, concisos (3 a 4 linhas), em português do Brasil, sem clichês, otimizados para triagem em sistemas ATS (Gupy, Greenhouse).'
            },
            {
              role: 'user',
              content: `Escreva o resumo profissional para o currículo abaixo:
              
Nome: ${fullName}
Cargo Alvo: ${jobTitle}
Localização: ${cityState}
Histórico Profissional:
${listaExperiencias || 'Experiências práticas e projetos relevantes na área.'}
Formação:
${listaFormacoes || 'Formação contínua e qualificação técnica.'}
Habilidades Principais: ${skills || 'Competências comportamentais e técnicas da função.'}
Idiomas: ${languages || 'Não especificado.'}

Regras:
1. Retorne APENAS o parágrafo pronto (sem aspas, sem títulos ou notas adicionais).
2. Comece direto destacando as competências fortes e a atuação profissional.
3. Máximo de 4 linhas fluidas e de alto impacto.`
            }
          ],
          max_tokens: 180,
          temperature: 0.7,
        });

        const summaryGerado = response.choices[0]?.message?.content?.trim();
        if (summaryGerado) {
          return res.status(200).json({ summary: summaryGerado });
        }
      } catch (openAiError) {
        console.warn('⚠️ Falha na API da OpenAI (chave inválida ou sem saldo), ativando motor de geração inteligente offline:', openAiError.message);
      }
    }

    // 3. Motor de Geração Inteligente Offline (Fallback de Alta Qualidade)
    // Gera um resumo ATS profissional personalizado mesmo sem gastar saldo ou se a API estiver offline
    const expPrincipal = exps.find(e => e.position || e.companyName);
    const cargoRecente = expPrincipal?.position || jobTitle;
    const empresaRecente = expPrincipal?.companyName ? ` na ${expPrincipal.companyName}` : '';
    const eduPrincipal = edus.find(e => e.courseName || e.institution);
    const formacaoTexto = eduPrincipal ? ` com formação em ${eduPrincipal.courseName || 'sua área'} pela ${eduPrincipal.institution || 'instituição de ensino'}` : '';

    const summaryOffline = `Profissional qualificado com sólida atuação como ${cargoRecente}${empresaRecente}${formacaoTexto}. Especialista em otimização de processos, resolução de problemas complexos e alcance de metas estratégicas com foco em resultados mensuráveis.${skills ? ` Possui sólido domínio técnico em ${skills}.` : ''}${languages ? ` ${languages}.` : ''} Perfil analítico, colaborativo e orientador de valor para equipes de alta performance.`;

    return res.status(200).json({ 
      summary: summaryOffline,
      note: !openai ? 'Gerado pelo motor ATS offline (adicione sua OPENAI_API_KEY no .env para usar GPT-4o-mini).' : undefined
    });

  } catch (error) {
    console.error('Erro no controlador de IA:', error);
    return res.status(500).json({ error: 'Erro ao gerar o resumo profissional.' });
  }
};
