import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, ChevronUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useRestaurant } from '../context/RestaurantContext';
import { SEO } from '../components/ui/SEO';

export function LegalPage() {
  const { t } = useLanguage();
  const { legalContent } = useRestaurant();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const hasCustomTerms = !!legalContent?.terms_html;
  const hasCustomPrivacy = !!legalContent?.privacy_html;

  return (
    <div className="min-h-screen bg-white font-sans">
      <SEO
        title={t('legal.pageTitle')}
        description={t('legal.metaDescription')}
        canonical="/legal"
      />

      {/* Header */}
      <div className="bg-dark text-white py-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark to-primary-vibrant/20" />
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-vibrant via-secondary-vibrant to-primary-vibrant" />
        <div className="max-w-3xl mx-auto relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            {t('legal.backHome')}
          </Link>
          <h1 className="font-display text-4xl md:text-5xl uppercase tracking-wider mb-4">{t('legal.title')}</h1>
          <p className="text-zinc-400 text-sm">{t('legal.lastUpdated')}</p>
        </div>
      </div>

      {/* Navigation interna */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-zinc-100">
        <div className="max-w-3xl mx-auto px-6 py-3 flex gap-6 overflow-x-auto">
          <a href="#terminos" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-primary-vibrant transition-colors whitespace-nowrap">
            <FileText className="w-3.5 h-3.5" />
            {t('legal.nav.terms')}
          </a>
          <a href="#privacidad" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-primary-vibrant transition-colors whitespace-nowrap">
            <Shield className="w-3.5 h-3.5" />
            {t('legal.nav.privacy')}
          </a>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-20">

        {/* ==================== TÉRMINOS Y CONDICIONES ==================== */}
        <section id="terminos" className="space-y-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-vibrant/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-vibrant" />
            </div>
            <h2 className="font-display text-2xl uppercase tracking-wider">{t('legal.terms.title')}</h2>
          </div>

          {hasCustomTerms ? (
            <div
              className="prose prose-zinc max-w-none text-zinc-700 leading-relaxed text-[15px]"
              dangerouslySetInnerHTML={{ __html: legalContent!.terms_html }}
            />
          ) : (
            <div className="space-y-8 text-zinc-700 leading-relaxed text-[15px]">
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.terms.s1.title')}</h3>
                <p>{t('legal.terms.s1.text')}</p>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.terms.s2.title')}</h3>
                <p className="mb-3">{t('legal.terms.s2.p1')}</p>
                <p>{t('legal.terms.s2.p2')}</p>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.terms.s3.title')}</h3>
                <p className="mb-3">{t('legal.terms.s3.p1')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('legal.terms.s3.li1')}</li>
                  <li>{t('legal.terms.s3.li2')}</li>
                  <li>{t('legal.terms.s3.li3')}</li>
                  <li>{t('legal.terms.s3.li4')}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.terms.s4.title')}</h3>
                <p className="mb-3">{t('legal.terms.s4.p1')}</p>
                <p>{t('legal.terms.s4.p2')}</p>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.terms.s5.title')}</h3>
                <p className="mb-3">{t('legal.terms.s5.p1')}</p>
                <p>{t('legal.terms.s5.p2')}</p>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.terms.s6.title')}</h3>
                <p className="mb-3">{t('legal.terms.s6.p1')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('legal.terms.s6.li1')}</li>
                  <li>{t('legal.terms.s6.li2')}</li>
                  <li>{t('legal.terms.s6.li3')}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.terms.s7.title')}</h3>
                <p>{t('legal.terms.s7.text')}</p>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.terms.s8.title')}</h3>
                <p className="mb-3">{t('legal.terms.s8.p1')}</p>
                <p>{t('legal.terms.s8.p2')}</p>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.terms.s9.title')}</h3>
                <p>{t('legal.terms.s9.text')}</p>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.terms.s10.title')}</h3>
                <p>{t('legal.terms.s10.text')}</p>
              </div>
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
          <div className="w-2 h-2 bg-primary-vibrant/30 rounded-full" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
        </div>

        {/* ==================== POLÍTICA DE PRIVACIDAD ==================== */}
        <section id="privacidad" className="space-y-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary-vibrant/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-secondary-vibrant" />
            </div>
            <h2 className="font-display text-2xl uppercase tracking-wider">{t('legal.privacy.title')}</h2>
          </div>

          {hasCustomPrivacy ? (
            <div
              className="prose prose-zinc max-w-none text-zinc-700 leading-relaxed text-[15px]"
              dangerouslySetInnerHTML={{ __html: legalContent!.privacy_html }}
            />
          ) : (
            <div className="space-y-8 text-zinc-700 leading-relaxed text-[15px]">
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.privacy.s1.title')}</h3>
                <p className="mb-3">{t('legal.privacy.s1.p1')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('legal.privacy.s1.li1')}</li>
                  <li>{t('legal.privacy.s1.li2')}</li>
                  <li>{t('legal.privacy.s1.li3')}</li>
                  <li>{t('legal.privacy.s1.li4')}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.privacy.s2.title')}</h3>
                <p className="mb-3">{t('legal.privacy.s2.p1')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('legal.privacy.s2.li1')}</li>
                  <li>{t('legal.privacy.s2.li2')}</li>
                  <li>{t('legal.privacy.s2.li3')}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.privacy.s3.title')}</h3>
                <p className="mb-3">{t('legal.privacy.s3.p1')}</p>
                <p>{t('legal.privacy.s3.p2')}</p>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.privacy.s4.title')}</h3>
                <p>{t('legal.privacy.s4.text')}</p>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.privacy.s5.title')}</h3>
                <p>{t('legal.privacy.s5.text')}</p>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.privacy.s6.title')}</h3>
                <p className="mb-3">{t('legal.privacy.s6.p1')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('legal.privacy.s6.li1')}</li>
                  <li>{t('legal.privacy.s6.li2')}</li>
                  <li>{t('legal.privacy.s6.li3')}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.privacy.s7.title')}</h3>
                <p>{t('legal.privacy.s7.text')}</p>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.privacy.s8.title')}</h3>
                <p>{t('legal.privacy.s8.text')}</p>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-wide text-dark mb-3">{t('legal.privacy.s9.title')}</h3>
                <p>{t('legal.privacy.s9.text')}</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-100 py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-400 text-xs">&copy; {new Date().getFullYear()} Wallace Panda Express</p>
          <Link to="/" className="text-zinc-400 hover:text-primary-vibrant text-xs font-medium transition-colors">
            {t('legal.backHome')}
          </Link>
        </div>
      </div>

      {/* Botón volver arriba */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 w-12 h-12 bg-dark text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-vibrant transition-colors z-50"
        aria-label="Volver arriba">
        <ChevronUp className="w-5 h-5" />
      </button>
    </div>
  );
}
