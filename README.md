<div align="center">

<img src="docs/screenshots/EnemPro-PlayStore-Icon-512.png" width="120" alt="Enem Pro logo">

# Enem Pro

**App Android para estudo do ENEM com provas oficiais offline e simulados cronometrados.**

[![Made with React Native](https://img.shields.io/badge/React%20Native-0.84-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Privacy First](https://img.shields.io/badge/Privacy-First-43A047)](docs/privacy-policy.html)

</div>

---

## Sobre

O **Enem Pro** é um app Android nativo que reúne provas e gabaritos oficiais do ENEM (2017–2025), permite leitura offline e oferece um modo simulado completo com correção automática contra o gabarito oficial.

Foi desenvolvido como um produto real (publicado na Play Store) e como um portfólio técnico mostrando arquitetura de app moderno em React Native — com privacidade radical, modelo freemium funcional e zero dependência de backend próprio.

## Screenshots

<div align="center">

| Catálogo de provas | Resultado de simulado |
|---|---|
| <img src="docs/screenshots/1.png" width="240"> | <img src="docs/screenshots/2.png" width="240"> |

</div>

## Funcionalidades

### Versão gratuita
- Catálogo de provas do ENEM por ano e cor de caderno
- Download sob demanda dos PDFs oficiais (HTTP fallback pro INEP)
- Leitor de PDF com modo leitura imersivo (chrome auto-hide)
- Histórico de simulados (últimos 3)
- Simulado completo (até 90 questões) com texto, imagens e alternativas
- Simulado por área (Linguagens, Humanas, Natureza, Matemática)
- Gabarito oficial INEP para correção
- Cronômetro e progresso salvos automaticamente
- Resultado por área de conhecimento
- 100% offline depois do download (apenas o catálogo é fetch)

### Versão Premium (R$ 8,90/mês via Google Play Billing)
- Correção detalhada questão por questão
- Histórico ilimitado de simulados
- Detalhamento de armazenamento por ano e por tipo
- Sem anúncios

## Stack

| Camada | Tecnologia |
|---|---|
| **Mobile** | React Native 0.84, TypeScript |
| **UI** | React Native Paper (Material Design 3) |
| **Navigation** | React Navigation 7 (stack + tabs) |
| **Storage** | MMKV (key-value síncrono nativo) |
| **PDF** | WebView + pdf.js (Mozilla, bundled local) |
| **Downloads** | react-native-blob-util |
| **Splash** | react-native-bootsplash |
| **Anúncios** | Google AdMob (banner + interstitial) |
| **IAP** | Google Play Billing (planejado) |

## Arquitetura

```
src/
├── appInfo.ts              # Constantes globais (versão, nome)
├── assets/                 # Manifest de PDFs, gabaritos, questões, licenças
├── components/             # ErrorBoundary global
├── navigation/             # Stack + bottom tabs tipados
├── screens/                # 14 telas
├── services/               # Lógica de negócio sem React
│   ├── storage.ts          # Singleton MMKV
│   ├── downloadService.ts  # Fila de downloads + persistência
│   ├── manifestService.ts  # Catálogo de PDFs (bundled)
│   ├── gabaritoService.ts  # Respostas oficiais
│   ├── questoesService.ts  # Texto e alternativas (via enem.dev)
│   ├── simuladoService.ts  # Histórico e progresso de simulados
│   ├── proService.ts       # Status freemium
│   └── adService.ts        # Banner e interstitial
└── types/                  # Tipos TypeScript
```

### Decisões importantes

- **Sem backend próprio.** Todos os dados (PDFs, gabaritos, questões) vêm de fontes públicas. O catálogo é embutido no bundle.
- **Privacidade radical.** Zero analytics, zero login, zero coleta. Tudo armazenado localmente em MMKV.
- **HTTP em vez de HTTPS pro INEP** — o servidor `download.inep.gov.br` tem certificado SSL inválido. Workaround documentado em `network_security_config.xml`.
- **WebView + pdf.js em vez de react-native-pdf** — a lib nativa quebra com OOM ao paginar PDFs grandes do INEP.
- **Manifest bundled em vez de fetch remoto** — adicionar/remover provas requer rebuild, mas elimina latência e dependência externa pro catálogo.
- **Scripts de build próprios** (`scripts/build-licenses.js`, `build-questoes.js`, `build-gabaritos.js`) geram assets a partir de fontes externas em build-time.
- **Singleton MMKV** evita instâncias duplicadas e centraliza persistência.
- **ErrorBoundary global** captura crashes no nível do app.

## Como rodar localmente

### Pré-requisitos
- Node.js 20+
- JDK 17
- Android SDK 34
- ADB

### Setup
```bash
git clone https://github.com/bruno2703/enem-pro.git
cd enem-pro
npm install

# Conecta o celular Android via USB ou Wi-Fi (adb tcpip + connect)
adb devices

# Inicia o Metro bundler
npx react-native start

# Em outro terminal: builda e instala
npx react-native run-android
```

### Build de release (assinado)

Crie `android/keystore.properties`:
```properties
storeFile=/caminho/para/sua.keystore
storePassword=...
keyAlias=...
keyPassword=...
```

E rode:
```bash
cd android
./gradlew bundleRelease   # AAB para Play Store
./gradlew assembleRelease # APK
```

## Roadmap

- [x] Catálogo de PDFs e download offline
- [x] Leitor de PDF com modo leitura
- [x] Simulado com questões reais (texto + imagens + alternativas)
- [x] Histórico e correção por área
- [x] Modelo freemium (gates implementados)
- [x] Anúncios AdMob (test IDs)
- [ ] Google Play Billing (IAP real)
- [ ] Adaptive icons
- [ ] Versão iOS
- [ ] Modo escuro

## Aviso legal

O Enem Pro **não é** um aplicativo oficial e **não possui vínculo** com o INEP, MEC ou Governo Federal do Brasil. É uma ferramenta independente de estudo que facilita o acesso a materiais públicos disponibilizados pelo INEP sob licença Creative Commons.

## Licença

[MIT](LICENSE) — sinta-se livre pra ler, estudar, fazer fork e aprender. A marca "Enem Pro", o ícone e a publicação na Google Play são propriedade da Zenitium Studio.

## Contato

[zenitiumstudio@gmail.com](mailto:zenitiumstudio@gmail.com)
