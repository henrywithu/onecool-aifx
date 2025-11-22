# LikenessAI R&D Plan
## High-Fidelity Actor Likeness Model Architecture

---

## Executive Summary

This R&D plan addresses four critical challenges in our current AI-driven actor likeness generation system. Our analysis reveals systematic limitations in data ingestion, facial consistency, emotional range, and holistic realism that prevent the system from achieving production-quality results.

**Current Status**: Prototype with limited 5-second video data capturing only basic movements  
**Target**: Production-ready system generating high-fidelity, emotionally diverse, full-body actor representations

---

## Problem Statement

| Category | Specific Issue | Impact |
|:---------|:---------------|:-------|
| **Data Ingestion** | Limited, short video data (<5 seconds). Only capturing head turns, mouth movement, and reading numbers. | Insufficient feature representation for nuanced generation. |
| **Facial Consistency** | Likeness and face shape are inconsistent across different generated clips. | High visual artifact rate; final product does not reliably resemble the source actor. |
| **Emotional Range** | Data only captures a limited, neutral emotional spectrum. | When prompted for an unlearned emotion (e.g., ecstatic, weary), the model "hallucinates" a face, resulting in a non-likeness and poor expression fidelity. |
| **Holistic Realism** | The system focuses only on the face/head. | Fails to model the actor's full physique, posture, costume, and signature motorial traits (e.g., a specific way of walking or gesturing). |

---

## Technical Architecture Overview

### System Pipeline Flow

**1. Data Ingestion Layer**
   - **Multi-Modal Video Capture** → Captures diverse video data (angles, expressions, movements)
   - **Data Quality Validator** → Validates resolution, lighting, face visibility, motion blur
   - **Feature Extraction** → Extracts facial features and characteristics

**2. Identity Preservation Layer**
   - **Identity Embedding Generator** → Creates 768-dimensional identity vectors from facial descriptions
   - **Consistency Validator** → Validates generated content against identity baseline (cosine similarity ≥ 0.85)

**3. Emotion Control Layer**
   - **Emotion Spectrum Analyzer** → Identifies gaps in emotional coverage
   - **Missing Emotion Generator** → Synthesizes training data for unlearned emotions using Veo 3.0

**4. Generation & Refinement**
   - **Veo 3.0 Video Generation** → Generates 8-second video clips with specified emotions
   - **Likeness Parameter Refinement** → Fine-tunes output using natural language instructions

**5. Quality Assurance**
   - **Multi-Dimensional Validation** → Validates facial consistency, body proportions, motor traits
   - **Final Output** → Production-ready, high-fidelity actor likeness video

**Data Flow**: Video Capture → Quality Validation → Feature Extraction → Identity Embedding → Consistency Check → Emotion Analysis → Synthetic Generation → Veo 3.0 → Parameter Refinement → Final Validation → Output

---

## Challenge 1: Data Ingestion Enhancement

### Current Limitations
- ❌ Video clips limited to <5 seconds
- ❌ Only captures basic movements (head turns, mouth movement)
- ❌ Insufficient diversity in angles, lighting, expressions
- ❌ No quality validation pipeline

### Proposed Solution: Multi-Modal Data Ingestion Pipeline

#### Technical Implementation

**1. Data Quality Validator** ([data-quality-validator.ts](file:///Users/henry/Downloads/project/onecool-aifx/src/ai/flows/data-quality-validator.ts))

Validates video quality across multiple dimensions:

```typescript
interface DataQualityReport {
  overallScore: number;           // 0-1 composite score
  resolution: {
    width: number;
    height: number;
    score: number;                // 1.0 for 1080p+, 0.7 for 720p
  };
  lighting: {
    score: number;
    issues: string[];             // Harsh shadows, overexposure, etc.
  };
  faceVisibility: {
    score: number;
    percentage: number;           // % of frames with clear face
  };
  motionBlur: {
    score: number;
    detected: boolean;
  };
  diversity: {
    score: number;
    angles: number;               // Frontal, profile, 3/4, etc.
    expressions: number;
  };
  recommendations: string[];
}
```

**Scoring Algorithm**:
- Resolution: 20%
- Lighting: 25%
- Face Visibility: 30%
- Motion Blur: 10%
- Diversity: 15%

**2. Enhanced Data Collection Protocol**

| Data Type | Duration | Requirements | Purpose |
|:----------|:---------|:-------------|:--------|
| **Neutral Reference** | 30-60s | Multiple angles, consistent lighting | Identity baseline |
| **Expression Range** | 5-10s each | 8+ emotions at varying intensities | Emotion modeling |
| **Full-Body Movement** | 30-60s | Walking, gesturing, sitting, standing | Motor trait capture |
| **Contextual Scenarios** | 15-30s each | Different costumes, environments | Holistic realism |

### Expected Outcomes
- ✅ 10x increase in training data diversity
- ✅ Automated quality gating (reject clips scoring <0.7)
- ✅ Comprehensive feature representation across 50+ dimensions

---

## Challenge 2: Facial Consistency Enforcement

### Current Limitations
- ❌ Generated clips show inconsistent likeness
- ❌ Face shape varies between generations
- ❌ High visual artifact rate
- ❌ No identity preservation mechanism

### Proposed Solution: Identity Embedding & Consistency Validation

#### Technical Implementation

**1. Identity Embedding Generator** ([identity-embedding-generator.ts](file:///Users/henry/Downloads/project/onecool-aifx/src/ai/flows/identity-embedding-generator.ts))

> [!NOTE]
> **Current Workaround**: Genkit's embed API doesn't support multimodal content. We use Gemini Vision to generate detailed text descriptions of faces, then embed those descriptions as a proxy for face embeddings.

```typescript
interface IdentityEmbedding {
  embedding: number[];            // 768-dimensional vector (text-embedding-004)
  faceDescription: string;        // Detailed facial feature description
  consistencyScore: number;       // Cross-frame consistency (0-1)
  canonicalFrameIndex: number;    // Best reference frame
}
```

**Feature Extraction Focus**:
- Face shape and structure
- Eye shape, color, and spacing
- Nose shape and size
- Mouth and lip characteristics
- Skin tone and texture
- Hair color and style
- Distinctive features (freckles, moles, etc.)
- Overall facial proportions

**2. Consistency Validator** ([consistency-validator.ts](file:///Users/henry/Downloads/project/onecool-aifx/src/ai/flows/consistency-validator.ts))

Validates generated content against identity embedding:

```typescript
interface ConsistencyValidation {
  score: number;                  // Cosine similarity (0-1)
  passed: boolean;                // score >= threshold
  threshold: number;              // Default: 0.85
  details: string;
}
```

**Validation Pipeline**:
1. Generate description of generated content using Gemini Vision
2. Create embedding from content description
3. Calculate cosine similarity with identity embedding
4. Reject generations below threshold (0.85)

**Cosine Similarity Formula**:
```
similarity = (A · B) / (||A|| × ||B||)
```

### Expected Outcomes
- ✅ 95%+ consistency rate across generated clips
- ✅ Automated rejection of low-quality generations
- ✅ Quantifiable likeness metrics for quality assurance

---

## Challenge 3: Emotional Range Expansion

### Current Limitations
- ❌ Training data limited to neutral expressions
- ❌ Model "hallucinates" faces for unlearned emotions
- ❌ Poor expression fidelity for complex emotions
- ❌ No mechanism to generate missing emotional data

### Proposed Solution: Synthetic Emotion Generation & Validation

#### Technical Implementation

**1. Initial Data Analysis** ([initial-data-analysis.ts](file:///Users/henry/Downloads/project/onecool-aifx/src/ai/flows/initial-data-analysis.ts))

Analyzes existing video data to identify emotional gaps:

```typescript
interface SuitabilityReport {
  emotionalCoverage: {
    detected: string[];           // Emotions present in data
    missing: string[];            // Emotions to synthesize
    confidence: number;
  };
  recommendations: string[];
}
```

**2. Missing Emotion Generator** ([generate-missing-emotions.ts](file:///Users/henry/Downloads/project/onecool-aifx/src/ai/flows/generate-missing-emotions.ts))

Generates synthetic training data using **Veo 3.0**:

```typescript
interface EmotionGenerationConfig {
  imageDataUri: string;           // Reference frame
  missingEmotion: string;         // Target emotion
  targetNumberOfClips: number;    // Clips to generate
  identityEmbedding?: number[];   // For consistency validation
  intensity: 'subtle' | 'moderate' | 'intense';
  validateConsistency: boolean;   // Auto-reject low-quality clips
}
```

**Generation Process**:
1. Extract reference frame from neutral video
2. Use Veo 3.0 to animate emotion at specified intensity
3. Validate consistency against identity embedding
4. Retry if consistency score < 0.85
5. Generate multiple clips per emotion for diversity

**Veo 3.0 Configuration**:
```typescript
{
  model: 'googleai/veo-3.0-generate-001',
  config: {
    personGeneration: 'allow_adult',
    durationSeconds: 8,           // Max duration for Veo 3.0
    aspectRatio: '16:9'
  }
}
```

**Target Emotion Spectrum**:

| Category | Emotions | Intensity Levels |
|:---------|:---------|:-----------------|
| **Positive** | Joy, Excitement, Contentment, Pride | Subtle, Moderate, Intense |
| **Negative** | Sadness, Anger, Fear, Disgust | Subtle, Moderate, Intense |
| **Complex** | Confusion, Surprise, Contemplation, Weary | Subtle, Moderate, Intense |
| **Neutral** | Calm, Focused, Attentive | Baseline |

### Expected Outcomes
- ✅ 30+ distinct emotions at 3 intensity levels (90+ variations)
- ✅ Automated synthetic data generation pipeline
- ✅ Consistency-validated emotion library
- ✅ Elimination of face hallucination for known emotions

---

## Challenge 4: Holistic Realism Integration

### Current Limitations
- ❌ System only models face/head
- ❌ No full-body physique representation
- ❌ Missing posture and motor trait capture
- ❌ No costume or environmental context

### Proposed Solution: Full-Body Multi-Modal Modeling

#### Technical Implementation

**1. Expanded Data Capture Requirements**

```typescript
interface HolisticDataCapture {
  fullBodyReference: {
    frontView: string;            // Full-body frontal
    sideView: string;             // Full-body profile
    backView: string;             // Full-body rear
    physique: {
      height: number;
      build: 'slim' | 'average' | 'athletic' | 'heavy';
      posture: string;            // Description
    };
  };
  motorTraits: {
    walking: string;              // Video of walking gait
    gesturing: string;            // Common hand gestures
    sitting: string;              // Sitting posture
    standing: string;             // Standing posture
  };
  contextualData: {
    costumes: string[];           // Different outfits
    environments: string[];       // Various backgrounds
  };
}
```

**2. Likeness Parameter Refinement** ([refine-likeness-parameters.ts](file:///Users/henry/Downloads/project/onecool-aifx/src/ai/flows/refine-likeness-parameters.ts))

Enables fine-tuning of generated content using natural language:

```typescript
interface LikenessRefinement {
  baseImageDataUri: string;       // Generated content
  instructions: string;           // Natural language refinement
  refinedImageDataUri: string;    // Output
}
```

**Example Refinement Instructions**:
- "Adjust posture to be more relaxed with shoulders slightly slouched"
- "Add characteristic hand gesture with index finger pointing"
- "Modify walking gait to include slight limp on left leg"
- "Change costume to business suit with blue tie"

**3. Multi-Dimensional Validation**

Validate generated content across all dimensions:

```typescript
interface HolisticValidation {
  facialConsistency: number;      // 0.85+ required
  bodyProportions: number;        // Matches reference physique
  motorTraitFidelity: number;     // Matches characteristic movements
  contextualAccuracy: number;     // Costume/environment match
  overallScore: number;           // Composite score
}
```

### Expected Outcomes
- ✅ Full-body actor representation with characteristic traits
- ✅ Accurate motor trait reproduction (walking, gesturing, posture)
- ✅ Contextual realism with costume and environment awareness
- ✅ User-controllable refinement via natural language

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [x] Implement Data Quality Validator
- [x] Implement Identity Embedding Generator
- [x] Implement Consistency Validator
- [x] Set up Genkit flow infrastructure
- [ ] Establish quality thresholds and benchmarks

### Phase 2: Emotion Expansion (Weeks 5-8)
- [x] Implement Initial Data Analysis flow
- [x] Implement Missing Emotion Generator (Veo 3.0)
- [ ] Generate synthetic emotion library (30+ emotions × 3 intensities)
- [ ] Validate emotion consistency across all generated clips
- [ ] Build emotion spectrum visualization dashboard

### Phase 3: Holistic Integration (Weeks 9-12)
- [x] Implement Likeness Parameter Refinement
- [ ] Expand data capture protocol to include full-body
- [ ] Develop motor trait extraction and validation
- [ ] Integrate contextual data (costumes, environments)
- [ ] Build multi-dimensional validation pipeline

### Phase 4: Production Optimization (Weeks 13-16)
- [ ] Performance optimization (reduce generation time)
- [ ] Batch processing pipeline for large-scale data
- [ ] Real-time preview system
- [ ] User interface for parameter control
- [ ] Comprehensive testing and quality assurance

---

## Technology Stack

### Core Infrastructure
- **Framework**: Next.js 15.3.3 with TypeScript
- **AI Orchestration**: Google Genkit 1.20.0
- **Video Generation**: Veo 3.0 (8-second clips, 16:9 aspect ratio)
- **Vision Analysis**: Gemini 2.5 Flash (image preview)
- **Embeddings**: text-embedding-004 (768 dimensions)

### Key Dependencies
```json
{
  "@genkit-ai/google-genai": "^1.20.0",
  "@genkit-ai/next": "^1.20.0",
  "genkit": "^1.20.0",
  "firebase": "^11.9.1",
  "node-fetch": "^3.3.2",
  "zod": "^3.24.2"
}
```

### AI Flows Architecture
```
src/ai/flows/
├── data-quality-validator.ts      # Video quality assessment
├── identity-embedding-generator.ts # Face embedding creation
├── consistency-validator.ts        # Likeness validation
├── initial-data-analysis.ts       # Emotion gap analysis
├── generate-missing-emotions.ts   # Synthetic emotion generation
└── refine-likeness-parameters.ts  # Natural language refinement
```

---

## Success Metrics

### Quantitative Targets

| Metric | Current | Target | Measurement |
|:-------|:--------|:-------|:------------|
| **Facial Consistency** | ~60% | 95%+ | Cosine similarity ≥ 0.85 |
| **Emotion Coverage** | 3-5 emotions | 30+ emotions | Distinct expressions validated |
| **Data Quality Score** | 0.4-0.6 | 0.8+ | Composite quality metric |
| **Generation Success Rate** | ~70% | 95%+ | Clips passing validation |
| **Full-Body Accuracy** | 0% | 85%+ | Motor trait fidelity score |

### Qualitative Targets
- ✅ Eliminate face hallucination for trained emotions
- ✅ Consistent likeness across all generated content
- ✅ Natural emotional transitions and expressions
- ✅ Accurate reproduction of signature motor traits
- ✅ Production-ready quality for commercial use

---

## Risk Mitigation

### Technical Risks

> [!WARNING]
> **Multimodal Embedding Limitation**: Genkit's embed API currently doesn't support multimodal content. We're using text descriptions as a proxy, which may reduce accuracy.

**Mitigation**: Monitor Genkit updates for native multimodal embedding support. Consider integrating dedicated face recognition APIs (e.g., Azure Face API, AWS Rekognition) if accuracy is insufficient.

> [!CAUTION]
> **Veo 3.0 Rate Limits**: High-volume synthetic emotion generation may hit API rate limits.

**Mitigation**: Implement exponential backoff retry logic (already implemented in `refine-likeness-parameters.ts`). Consider batch processing with queuing system.

### Data Quality Risks

> [!IMPORTANT]
> **Insufficient Training Data**: Even with synthetic generation, some edge-case emotions may lack sufficient training examples.

**Mitigation**: Prioritize high-value emotions based on use case requirements. Implement active learning to identify and fill gaps.

---

## Budget & Resource Allocation

### API Costs (Estimated Monthly)

| Service | Usage | Cost per Unit | Monthly Cost |
|:--------|:------|:--------------|:-------------|
| **Veo 3.0** | 1,000 clips × 8s | $0.10/sec | $800 |
| **Gemini 2.5 Flash** | 10,000 requests | $0.001/request | $10 |
| **Text Embeddings** | 50,000 embeddings | $0.0001/embedding | $5 |
| **Storage** | 500GB video data | $0.02/GB | $10 |
| **Total** | | | **~$825/month** |

### Team Requirements
- **ML Engineer** (1 FTE): Model training and optimization
- **Backend Engineer** (0.5 FTE): Pipeline infrastructure
- **QA Engineer** (0.5 FTE): Validation and testing
- **Data Annotator** (0.25 FTE): Quality control and labeling

---

## Next Steps

### Immediate Actions (Week 1)
1. ✅ Review and approve R&D plan
2. [ ] Establish quality benchmarks and success criteria
3. [ ] Set up monitoring and logging infrastructure
4. [ ] Begin Phase 2: Synthetic emotion library generation
5. [ ] Create project dashboard for tracking metrics

### Decision Points
- [ ] **Week 4**: Evaluate consistency validation accuracy → Decide on face recognition API integration
- [ ] **Week 8**: Assess emotion library quality → Determine if additional emotions needed
- [ ] **Week 12**: Review holistic realism results → Finalize production readiness criteria

---

## Conclusion

This R&D plan provides a comprehensive roadmap to transform LikenessAI from a limited prototype into a production-ready, high-fidelity actor likeness generation system. By systematically addressing data ingestion, facial consistency, emotional range, and holistic realism, we will achieve:

- **10x improvement** in training data quality and diversity
- **95%+ facial consistency** across all generated content
- **30+ emotions** with natural expression fidelity
- **Full-body realism** with motor trait accuracy

The modular architecture built on Genkit flows enables incremental development and validation, reducing risk while maintaining flexibility for future enhancements.

**Recommended Decision**: Approve plan and proceed to Phase 2 (Emotion Expansion) while continuing to refine Phase 1 quality thresholds.

