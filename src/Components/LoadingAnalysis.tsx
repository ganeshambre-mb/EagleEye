import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Radio, Check } from 'lucide-react';
import { AUTH_HEADER } from '../constants/auth';
import './LoadingAnalysis.css';

interface LoadingAnalysisProps {
  companyId: string;
  onComplete: () => void;
}

interface AnalysisStep {
  id: number;
  text: string;
  status: 'pending' | 'active' | 'completed';
}

export function LoadingAnalysis({ companyId, onComplete }: LoadingAnalysisProps) {
  const [steps, setSteps] = useState<AnalysisStep[]>([
    { id: 1, text: 'Fetching updates from sources...', status: 'active' },
    { id: 2, text: 'Summarising competitor activity...', status: 'pending' },
    { id: 3, text: 'Categorizing new releases...', status: 'pending' },
    { id: 4, text: 'Building insights and trends...', status: 'pending' },
  ]);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let progressInterval: ReturnType<typeof setInterval> | null = null;

    const runAnalysis = async () => {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      try {
        // Start progress bar animation
        progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              if (progressInterval) clearInterval(progressInterval);
              return 100;
            }
            return Math.min(prev + 0.5, 100);
          });
        }, 50);

        // Step 1: Fetching updates from sources (Placeholder)
        if (!isMounted) return;
        await new Promise(resolve => setTimeout(resolve, 2000));
        setProgress(25);
        setSteps(prevSteps =>
          prevSteps.map((step, i) => {
            if (i === 0) return { ...step, status: 'completed' };
            if (i === 1) return { ...step, status: 'active' };
            return step;
          })
        );

        // Step 2: Summarising competitor activity (Real API)
        if (!isMounted) return;
        try {
          const scrapeResponse = await fetch(
            `${baseURL}/process-company`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTH_HEADER
              },
              body: JSON.stringify({
                company_id: '15'
              })
            }
          );
          
          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json();
            console.log('Scrape and summarize completed:', scrapeData);
          }
        } catch (error) {
          console.error('Step 2 API error:', error);
          // Continue even if API fails
        }
        
        setProgress(50);
        setSteps(prevSteps =>
          prevSteps.map((step, i) => {
            if (i === 1) return { ...step, status: 'completed' };
            if (i === 2) return { ...step, status: 'active' };
            return step;
          })
        );

        // Step 3: Categorizing new releases (Real API)
        // Simulate step 3 (Categorizing new releases) with a delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setProgress(75);
        setSteps(prevSteps =>
          prevSteps.map((step, i) => {
            if (i === 2) return { ...step, status: 'completed' };
            if (i === 3) return { ...step, status: 'active' };
            return step;
          })
        );

        // Step 4: Building insights and trends (Real API)
        if (!isMounted) return;
        // Simulate step 4 (Building insights and trends) with a delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        setProgress(100);
        setSteps(prevSteps =>
          prevSteps.map((step, i) => {
            if (i === 3) return { ...step, status: 'completed' };
            return step;
          })
        );

        // Complete after a short delay
        if (!isMounted) return;
        await new Promise(resolve => setTimeout(resolve, 500));
        onComplete();
        
      } catch (error) {
        console.error('Analysis error:', error);
        // Still complete even if there's an error
        setProgress(100);
        setTimeout(() => onComplete(), 500);
      }
    };

    runAnalysis();

    return () => {
      isMounted = false;
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [companyId, onComplete]);

  return (
    <div className="loading-analysis-overlay">
      <motion.div
        className="loading-analysis-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Icon */}
        <motion.div
          className="loading-icon"
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <Radio className="icon" />
        </motion.div>

        {/* Title */}
        <motion.h2
          className="loading-title"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Let's see what's happening in your market 👀
        </motion.h2>

        {/* Steps */}
        <div className="loading-steps">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              className={`loading-step ${step.status}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="step-indicator">
                {step.status === 'completed' ? (
                  <motion.div
                    className="step-check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <Check className="check-icon" />
                  </motion.div>
                ) : (
                  <div className="step-dot">
                    {step.status === 'active' && (
                      <motion.div
                        className="step-pulse"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
              <span className="step-text">{step.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="loading-progress-container">
          <motion.div
            className="loading-progress-bar"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Footer Text */}
        <motion.p
          className="loading-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          This usually takes about <span className="highlight">10 seconds</span>...
        </motion.p>
      </motion.div>
    </div>
  );
}

