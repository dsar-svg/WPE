import { useState, useEffect } from 'react';
import { Save, FileText, Shield, AlertCircle } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

export function LegalEditor() {
  const { legalContent, updateLegalContent } = useRestaurant();
  const [termsHtml, setTermsHtml] = useState('');
  const [privacyHtml, setPrivacyHtml] = useState('');
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (legalContent) {
      setTermsHtml(legalContent.terms_html);
      setPrivacyHtml(legalContent.privacy_html);
    }
  }, [legalContent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateLegalContent({ terms_html: termsHtml, privacy_html: privacyHtml });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">Contenido Legal</h2>
          <p className="text-admin-text-muted text-sm">Edita los Términos y Condiciones y la Política de Privacidad</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary-vibrant text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>

      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden">
        {/* Tab headers */}
        <div className="flex border-b border-admin-border">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-colors ${
              activeTab === 'terms'
                ? 'text-primary-vibrant border-b-2 border-primary-vibrant bg-primary-vibrant/5'
                : 'text-admin-muted hover:text-admin-text'
            }`}
          >
            <FileText className="w-4 h-4" />
            Términos y Condiciones
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-colors ${
              activeTab === 'privacy'
                ? 'text-secondary-vibrant border-b-2 border-secondary-vibrant bg-secondary-vibrant/5'
                : 'text-admin-muted hover:text-admin-text'
            }`}
          >
            <Shield className="w-4 h-4" />
            Política de Privacidad
          </button>
        </div>

        {/* Editor */}
        <div className="p-6">
          <div className="mb-4 flex items-start gap-2 text-xs text-admin-muted bg-admin-bg rounded-xl p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Escribe el contenido en HTML. Usa etiquetas como <code className="text-primary-vibrant">&lt;h3&gt;</code>, <code className="text-primary-vibrant">&lt;p&gt;</code>, <code className="text-primary-vibrant">&lt;ul&gt;</code>, <code className="text-primary-vibrant">&lt;li&gt;</code> para estructurar el texto.</span>
          </div>
          <textarea
            value={activeTab === 'terms' ? termsHtml : privacyHtml}
            onChange={(e) => activeTab === 'terms' ? setTermsHtml(e.target.value) : setPrivacyHtml(e.target.value)}
            className="w-full h-[500px] bg-admin-bg border border-admin-border rounded-xl p-4 text-sm text-admin-text font-mono resize-y focus:border-primary-vibrant outline-none transition-colors"
            placeholder={activeTab === 'terms' ? '<h3>1. Aceptación de los Términos</h3>\n<p>Al acceder...</p>' : '<h3>1. Información que Recopilamos</h3>\n<p>Recopilamos...</p>'}
          />
        </div>
      </div>

      {/* Preview */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl p-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-admin-muted mb-4">Vista Previa</h3>
        <div
          className="prose prose-invert prose-sm max-w-none text-admin-text"
          dangerouslySetInnerHTML={{ __html: activeTab === 'terms' ? termsHtml : privacyHtml }}
        />
        {!(activeTab === 'terms' ? termsHtml : privacyHtml) && (
          <p className="text-admin-muted text-sm italic">No hay contenido para previsualizar. Escribe algo en el editor.</p>
        )}
      </div>
    </div>
  );
}
