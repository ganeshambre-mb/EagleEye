import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Plus, X, ArrowRight, ArrowLeft, CheckCircle2, Tag, Slack } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import './OnboardingFlow.css';

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface Competitor {
  id: string;
  name: string;
  releaseUrl: string;
}

interface Category {
  id: string;
  name: string;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('Acme Corp');
  const [slackConnected, setSlackConnected] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  // Fetch companies and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch companies
        const companiesResponse = await fetch('http://localhost:8000/companies?skip=0&limit=100');
        const companiesData = await companiesResponse.json();
        
        // Map companies to competitors format
        const mappedCompetitors = companiesData.map((company: any) => ({
          id: company.id?.toString() || Date.now().toString(),
          name: company.name || '',
          releaseUrl: company.release_page_url || company.releaseUrl || ''
        }));
        
        setCompetitors(mappedCompetitors.length > 0 ? mappedCompetitors : [
          { id: '1', name: 'Zenoti', releaseUrl: 'https://zenoti.com/releases' }
        ]);

        // Fetch categories
        const categoriesResponse = await fetch('http://localhost:8000/categories');
        const categoriesData = await categoriesResponse.json();
        
        // Handle both response formats: array or {categories: array}
        const categoriesArray = Array.isArray(categoriesData) 
          ? categoriesData 
          : categoriesData.categories || [];
        
        // Map categories
        const mappedCategories = categoriesArray.map((category: any) => ({
          id: category.id?.toString() || Date.now().toString(),
          name: category.name || ''
        }));
        
        setCategories(mappedCategories.length > 0 ? mappedCategories : [
          { id: '1', name: 'Appointments' },
          { id: '2', name: 'Analytics' }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set default values if fetch fails
        setCompetitors([
          { id: '1', name: 'Zenoti', releaseUrl: 'https://zenoti.com/releases' }
        ]);
        setCategories([
          { id: '1', name: 'Appointments' },
          { id: '2', name: 'Analytics' }
        ]);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addCompetitor = () => {
    setCompetitors([...competitors, { id: Date.now().toString(), name: '', releaseUrl: '' }]);
  };

  const removeCompetitor = (id: string) => {
    setCompetitors(competitors.filter(c => c.id !== id));
  };

  const updateCompetitor = (id: string, field: 'name' | 'releaseUrl', value: string) => {
    setCompetitors(competitors.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const addCategory = () => {
    setCategories([...categories, { id: Date.now().toString(), name: '' }]);
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const updateCategory = (id: string, value: string) => {
    setCategories(categories.map(c => 
      c.id === id ? { ...c, name: value } : c
    ));
  };

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="loading-spinner"></div>
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      {/* Header */}
      <header className="onboarding-header">
        <div className="onboarding-header-content">
          <div className="onboarding-header-inner">
            <div className="onboarding-logo">
              <div className="onboarding-logo-icon">
                <Radio className="icon-radio" />
              </div>
              <span className="onboarding-logo-text">Eagle Eye</span>
            </div>
            <div className="onboarding-progress-section">
              <span className="onboarding-step-text">Step {step} of {totalSteps}</span>
              <div className="onboarding-progress-wrapper">
                <Progress value={progress} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="onboarding-container">
        <AnimatePresence mode="wait">
          {/* Step 1: Connect Slack */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="onboarding-step"
            >
              <div className="step-header">
                <div className="step-icon purple">
                  <Slack className="icon" />
                </div>
                <h2 className="step-title">Connect to Slack</h2>
                <p className="step-description">
                  Get weekly competitive summaries delivered directly to your Slack workspace.
                </p>
              </div>

              <div className="step-card">
                {!slackConnected ? (
                  <div className="slack-connect-section">
                    <Button
                      onClick={() => setSlackConnected(true)}
                      className="slack-connect-button"
                    >
                      <Slack className="button-icon" />
                      Connect Slack Workspace
                    </Button>
                    <p className="skip-text">
                      You can skip this step and add it later in settings
                    </p>
                  </div>
                ) : (
                  <div className="slack-connected">
                    <div className="slack-info">
                      <div className="slack-logo">
                        <Slack className="icon-white" />
                      </div>
                      <div className="slack-details">
                        <p className="workspace-name">Acme Corp Workspace</p>
                        <p className="channel-name">#competitive-intel</p>
                      </div>
                    </div>
                    <CheckCircle2 className="check-icon" />
                  </div>
                )}
              </div>

              <div className="step-actions">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Skip for now
                </Button>
                <Button 
                  onClick={() => setStep(2)}
                  disabled={!slackConnected}
                  className="next-button"
                >
                  Next
                  <ArrowRight className="button-icon-right" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Define Competitors */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="onboarding-step"
            >
              <div className="step-header">
                <div className="step-icon blue">
                  <Radio className="icon" />
                </div>
                <h2 className="step-title">Define Competitors</h2>
                <p className="step-description">
                  Start by adding your company, then list the competitors you want to track.
                </p>
              </div>

              <div className="step-card">
                <div className="step-card-content">
                  {/* My Company */}
                  <div className="company-section">
                    <Label className="section-label">My Company</Label>
                    <Input 
                      placeholder="Company name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>

                  {/* Competitors List */}
                  <div className="competitors-section">
                    <Label className="section-label">Competitors to Track</Label>
                    <div className="competitors-list">
                      {competitors.map((competitor) => (
                        <div key={competitor.id} className="competitor-row">
                          <div className="competitor-inputs">
                            <div className="input-group">
                              <Label className="input-label">Company Name</Label>
                              <Input 
                                placeholder="e.g., Zenoti"
                                value={competitor.name}
                                onChange={(e) => updateCompetitor(competitor.id, 'name', e.target.value)}
                              />
                            </div>
                            <div className="input-group">
                              <Label className="input-label">Release Page URL</Label>
                              <Input 
                                placeholder="https://example.com/releases"
                                value={competitor.releaseUrl}
                                onChange={(e) => updateCompetitor(competitor.id, 'releaseUrl', e.target.value)}
                              />
                            </div>
                          </div>
                          {competitors.length > 1 && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => removeCompetitor(competitor.id)}
                              className="remove-button"
                            >
                              <X className="icon-sm" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        className="add-button"
                        onClick={addCompetitor}
                      >
                        <Plus className="icon-sm" />
                        Add Competitor
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="step-actions">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="button-icon-left" />
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)}
                  className="next-button"
                >
                  Next
                  <ArrowRight className="button-icon-right" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Define Categories */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="onboarding-step"
            >
              <div className="step-header">
                <div className="step-icon teal">
                  <Tag className="icon" />
                </div>
                <h2 className="step-title">Define Categories</h2>
                <p className="step-description">
                  Organize releases by category to spot trends and filter intelligently.
                </p>
              </div>

              <div className="step-card">
                <div className="categories-list">
                  {categories.map((category) => (
                    <div key={category.id} className="category-row">
                      <div className="category-input-wrapper">
                        <Label className="input-label">Category Name</Label>
                        <Input 
                          placeholder="e.g., Analytics"
                          value={category.name}
                          onChange={(e) => updateCategory(category.id, e.target.value)}
                        />
                      </div>
                      {categories.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeCategory(category.id)}
                          className="remove-button"
                        >
                          <X className="icon-sm" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="add-button"
                    onClick={addCategory}
                  >
                    <Plus className="icon-sm" />
                    Add Category
                  </Button>
                </div>
              </div>

              <div className="step-actions">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="button-icon-left" />
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(4)}
                  className="next-button"
                >
                  Next
                  <ArrowRight className="button-icon-right" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Start Analysis */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="onboarding-step"
            >
              <div className="step-header">
                <div className="step-icon green">
                  <CheckCircle2 className="icon" />
                </div>
                <h2 className="step-title">Ready to Start Tracking</h2>
                <p className="step-description">
                  Eagle Eye will begin monitoring your competitors and categorizing their releases automatically.
                </p>
              </div>

              <div className="step-card">
                <div className="summary-content">
                  <div className="summary-section">
                    <h3 className="summary-heading">Your Company</h3>
                    <div className="company-badge">
                      <p className="company-name">{companyName}</p>
                    </div>
                  </div>

                  <div className="summary-section">
                    <h3 className="summary-heading">Tracking {competitors.length} Competitors</h3>
                    <div className="competitors-summary">
                      {competitors.map((competitor) => (
                        <div key={competitor.id} className="competitor-summary-item">
                          <span className="competitor-summary-name">{competitor.name || 'Unnamed Competitor'}</span>
                          <span className="competitor-summary-url">{competitor.releaseUrl}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="summary-section">
                    <h3 className="summary-heading">{categories.length} Categories</h3>
                    <div className="categories-badges">
                      {categories.map((category) => (
                        <div key={category.id} className="category-badge">
                          {category.name || 'Unnamed Category'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="step-actions">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="button-icon-left" />
                  Back
                </Button>
                <Button 
                  onClick={onComplete}
                  className="start-button"
                >
                  <CheckCircle2 className="button-icon-left" />
                  Start Analysis
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

