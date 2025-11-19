import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Plus, X, ArrowRight, ArrowLeft, CheckCircle2, Tag } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { LoadingAnalysis } from './LoadingAnalysis';
import { AUTH_HEADER } from '../constants/auth';
import './OnboardingFlow.css';

interface OnboardingFlowProps {
  onComplete: () => void;
  initialStep?: number;
}

interface Competitor {
  id: string;
  name: string;
  releaseUrl: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface CompanyAPIResponse {
  id?: number | string;
  name?: string;
  homepage_url?: string;
  release_url?: string;  // Add snake_case variant
  releaseUrl?: string;   // camelCase variant
  changelog_url?: string;
}

interface CategoryAPIResponse {
  id?: number | string;
  name?: string;
  description?: string;
  is_active?: boolean;
}

export function OnboardingFlow({ onComplete, initialStep = 1 }: OnboardingFlowProps) {
  const [step, setStep] = useState(initialStep);
  const [companyName, setCompanyName] = useState('Mindbody Inc');
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [initialCompetitorCount, setInitialCompetitorCount] = useState(0);
  const [initialCategoryCount, setInitialCategoryCount] = useState(0);
  const [originalCategories, setOriginalCategories] = useState<Category[]>([]);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  // Fetch companies and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        
        // Fetch companies
        const companiesResponse = await fetch(`${baseURL}/companies?skip=0&limit=100`, {
          headers: {
            'Authorization': AUTH_HEADER
          }
        });
        const companiesData = await companiesResponse.json();
        console.log('[OnboardingFlow] Fetched companies:', companiesData);
        
        // Map companies to competitors format
        const mappedCompetitors = (companiesData as CompanyAPIResponse[]).map((company) => {
          console.log('[OnboardingFlow] Mapping company:', company);
          return {
            id: company.id?.toString() || Date.now().toString(),
            name: company.name || '',
            releaseUrl: company.homepage_url || company.release_url || company.releaseUrl || company.changelog_url || ''
          };
        });
        
        // Only set competitors if we got data from API, otherwise start with empty
        setCompetitors(mappedCompetitors.length > 0 ? mappedCompetitors : []);
        setInitialCompetitorCount(mappedCompetitors.length > 0 ? mappedCompetitors.length : 0);

        // Fetch categories
        const categoriesResponse = await fetch(`${baseURL}/categories`, {
          headers: {
            'Authorization': AUTH_HEADER
          }
        });
        const categoriesData = await categoriesResponse.json();
        
        // Handle both response formats: array or {categories: array}
        const categoriesArray = Array.isArray(categoriesData) 
          ? categoriesData 
          : categoriesData.categories || [];
        
        // Map categories
        const mappedCategories = (categoriesArray as CategoryAPIResponse[]).map((category) => ({
          id: category.id?.toString() || Date.now().toString(),
          name: category.name || '',
          description: category.description || ''
        }));
        
        setCategories(mappedCategories.length > 0 ? mappedCategories : [
          { id: '1', name: 'Appointments' },
          { id: '2', name: 'Analytics' }
        ]);
        setInitialCategoryCount(mappedCategories.length > 0 ? mappedCategories.length : 2);
        setOriginalCategories(mappedCategories.length > 0 ? [...mappedCategories] : [
          { id: '1', name: 'Appointments' },
          { id: '2', name: 'Analytics' }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Start with empty arrays if fetch fails
        setCompetitors([]);
        setCategories([]);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addCompetitor = () => {
    setCompetitors([...competitors, { id: `new_${Date.now()}`, name: '', releaseUrl: '' }]);
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
    setCategories([...categories, { id: `new_${Date.now()}`, name: '' }]);
  };

  const removeCategory = async (id: string) => {
    // If it's an existing category (from API), delete it
    if (!id.startsWith('new_')) {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      try {
        console.log('[OnboardingFlow] Deleting category:', id);
        const response = await fetch(`${baseURL}/categories/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': AUTH_HEADER
          }
        });
        
        if (response.ok) {
          console.log('[OnboardingFlow] Category deleted successfully');
        } else {
          console.error('[OnboardingFlow] Failed to delete category:', response.status);
          alert('Failed to delete category. Please try again.');
          return;
        }
      } catch (error) {
        console.error('[OnboardingFlow] Error deleting category:', error);
        alert('An error occurred while deleting category.');
        return;
      }
    }
    
    // Remove from state
    setCategories(categories.filter(c => c.id !== id));
  };

  const updateCategory = (id: string, value: string) => {
    setCategories(categories.map(c => 
      c.id === id ? { ...c, name: value } : c
    ));
  };

  const handleStartAnalysis = async () => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    try {
      // Check if there are any competitors at all
      if (competitors.length === 0) {
        console.error('No competitors added. Please add at least one competitor.');
        alert('Please add at least one competitor before starting analysis.');
        return;
      }

      // Check if we need to create new companies
      // New competitors have IDs starting with "new_", API companies have numeric IDs
      const newCompetitors = competitors.filter(c => c.id.startsWith('new_'));
      
      if (newCompetitors.length > 0) {
        // Create the first new competitor and get its ID
        const firstNew = newCompetitors[0];
        
        if (!firstNew.name || !firstNew.releaseUrl) {
          alert('Please provide both company name and release page URL.');
          return;
        }
        
        const payload = {
          name: firstNew.name,
          homepage_url: firstNew.releaseUrl
        };
        console.log('[OnboardingFlow] Creating company with payload:', payload);
        
        const response = await fetch(`${baseURL}/companies`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': AUTH_HEADER
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const createdCompany = await response.json();
          console.log('[OnboardingFlow] Company created response:', createdCompany);
          setSelectedCompanyId(createdCompany.id?.toString() || null);
        } else {
          const errorText = await response.text();
          console.error('[OnboardingFlow] Failed to create company:', response.status, errorText);
          // Fallback to first existing company (from API)
          const existingCompany = competitors.find(c => !c.id.startsWith('new_'));
          if (existingCompany) {
            setSelectedCompanyId(existingCompany.id);
          } else {
            alert('Failed to create company. Please try again.');
            return;
          }
        }
      } else {
        // Use the first existing company from prefilled data
        const firstCompany = competitors[0];
        setSelectedCompanyId(firstCompany.id);
      }

      // Update modified existing categories
      const existingCategories = categories.filter(c => !c.id.startsWith('new_'));
      const modifiedCategories = existingCategories.filter(category => {
        const original = originalCategories.find(o => o.id === category.id);
        return original && original.name !== category.name;
      });

      if (modifiedCategories.length > 0) {
        console.log('[OnboardingFlow] Updating modified categories:', modifiedCategories);
        
        for (const category of modifiedCategories) {
          if (!category.name.trim()) {
            console.warn('[OnboardingFlow] Skipping category with empty name');
            continue;
          }
          
          try {
            const url = new URL(`${baseURL}/categories/${category.id}`);
            url.searchParams.append('name', category.name);
            // Don't send description or is_active since we're not managing those in UI
            
            console.log('[OnboardingFlow] Updating category:', category.id, category.name);
            const response = await fetch(url.toString(), {
              method: 'PUT',
              headers: {
                'accept': 'application/json',
                'Authorization': AUTH_HEADER
              }
            });
            
            if (response.ok) {
              const updatedCategory = await response.json();
              console.log('[OnboardingFlow] Category updated:', updatedCategory);
              
              // Update originalCategories to reflect the new state
              setOriginalCategories(prev => 
                prev.map(c => c.id === category.id ? { ...c, name: category.name } : c)
              );
            } else {
              const errorText = await response.text();
              console.error('[OnboardingFlow] Failed to update category:', response.status, errorText);
            }
          } catch (error) {
            console.error('[OnboardingFlow] Error updating category:', error);
          }
        }
      }

      // Create new categories before starting analysis
      const newCategories = categories.filter(c => c.id.startsWith('new_'));
      if (newCategories.length > 0) {
        console.log('[OnboardingFlow] Creating new categories:', newCategories);
        
        for (const category of newCategories) {
          if (!category.name.trim()) {
            console.warn('[OnboardingFlow] Skipping category with empty name');
            continue;
          }
          
          try {
            const url = new URL(`${baseURL}/categories`);
            url.searchParams.append('name', category.name);
            if (category.description && category.description.trim()) {
              url.searchParams.append('description', category.description);
            }
            
            console.log('[OnboardingFlow] Creating category:', category.name);
            const response = await fetch(url.toString(), {
              method: 'POST',
              headers: {
                'accept': 'application/json',
                'Authorization': AUTH_HEADER
              }
            });
            
            if (response.ok) {
              const createdCategory = await response.json();
              console.log('[OnboardingFlow] Category created:', createdCategory);
              
              // Update originalCategories to include the newly created category
              setOriginalCategories(prev => [...prev, {
                id: createdCategory.id?.toString() || category.id,
                name: createdCategory.name || category.name,
                description: createdCategory.description
              }]);
            } else {
              const errorText = await response.text();
              console.error('[OnboardingFlow] Failed to create category:', response.status, errorText);
            }
          } catch (error) {
            console.error('[OnboardingFlow] Error creating category:', error);
          }
        }
      }

      // Start the analysis flow
      setIsAnalyzing(true);
    } catch (error) {
      console.error('Error in handleStartAnalysis:', error);
      alert('An error occurred while starting analysis. Please try again.');
    }
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
          {/* Step 1: Connect Slack
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
                        <p className="workspace-name">Mindbody Inc Workspace</p>
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
          )} */}

          {/* Step 2: Define Competitors */}
          {step === 1 && (
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
                          {competitor.id.startsWith('new_') && (
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
                        disabled={competitors.length > initialCompetitorCount}
                      >
                        <Plus className="icon-sm" />
                        Add Competitor
                      </Button>
                      {competitors.length > initialCompetitorCount && (
                        <p className="info-text" style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '8px' }}>
                          You can add one new competitor at a time. Save this one or remove it to add another.
                        </p>
                      )}
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
                  onClick={() => setStep(2)}
                  className="next-button"
                >
                  Next
                  <ArrowRight className="button-icon-right" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Define Categories */}
          {step === 2 && (
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
                      {category.id.startsWith('new_') && (
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
                    disabled={categories.length > initialCategoryCount}
                  >
                    <Plus className="icon-sm" />
                    Add Category
                  </Button>
                  {categories.length > initialCategoryCount && (
                    <p className="info-text" style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '8px' }}>
                      You can add one new category at a time. Save this one or remove it to add another.
                    </p>
                  )}
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

          {/* Step 4: Start Analysis */}
          {step === 3 && (
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

                  {competitors.length > 0 && (
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
                  )}

                  {categories.length > 0 && (
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
                  )}
                </div>
              </div>

              <div className="step-actions">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="button-icon-left" />
                  Back
                </Button>
                <Button 
                  onClick={handleStartAnalysis}
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

      {/* Loading Analysis Overlay */}
      {isAnalyzing && selectedCompanyId && (
        <LoadingAnalysis 
          companyId={selectedCompanyId} 
          onComplete={onComplete} 
        />
      )}
    </div>
  );
}

