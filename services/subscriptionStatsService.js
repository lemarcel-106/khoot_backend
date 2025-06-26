// ==========================================
// SERVICE - services/subscriptionStatsService.js
// ==========================================

const Ecole = require('../models/Ecole');
const Abonnement = require('../models/Abonnement');
const Admin = require('../models/Admin');
const Apprenant = require('../models/Apprenant');
const Jeu = require('../models/Jeu');

const subscriptionStatsService = {

  /**
   * ✅ MÉTHODE PRINCIPALE : Statistiques détaillées avec utilisation vs limites
   */
  async getEcolesUtilisationAbonnements() {
    try {
      console.log('🔍 [SERVICE] Début de l\'analyse des écoles...');
      const startTime = Date.now();

      // Récupérer toutes les écoles avec leur abonnement
      const ecoles = await Ecole.find()
        .populate('abonnementActuel')
        .sort({ libelle: 1 })
        .lean();

      console.log(`📊 [SERVICE] ${ecoles.length} écoles trouvées`);

      const ecolesAvecUtilisation = [];
      const maintenant = new Date();

      for (const ecole of ecoles) {
        console.log(`🏫 [SERVICE] Traitement: ${ecole.libelle}`);

        // Compter les ressources actuelles en parallèle
        const [nombreEnseignants, nombreApprenants, nombreJeux] = await Promise.all([
          Admin.countDocuments({ 
            ecole: ecole._id, 
            role: { $in: ['admin', 'enseignant'] }
          }),
          Apprenant.countDocuments({ ecole: ecole._id }),
          Jeu.countDocuments({ ecole: ecole._id })
        ]);

        let abonnementInfo = null;
        let utilisationEnseignants = null;
        let utilisationApprenants = null;
        let utilisationJeux = null;
        let statutGeneral = 'Aucun abonnement';

        if (ecole.abonnementActuel) {
          const abonnement = ecole.abonnementActuel;
          
          // Vérifier si l'abonnement est encore valide
          const estValide = !abonnement.dateFin || new Date(abonnement.dateFin) > maintenant;
          
          if (estValide) {
            abonnementInfo = {
              _id: abonnement._id,
              nom: abonnement.nom,
              prix: abonnement.prix,
              dateDebut: abonnement.dateDebut,
              dateFin: abonnement.dateFin,
              joursRestants: abonnement.dateFin ? 
                Math.ceil((new Date(abonnement.dateFin) - maintenant) / (1000 * 60 * 60 * 24)) : 
                -1, // -1 = illimité
              actif: abonnement.actif
            };

            // Calculer l'utilisation des enseignants
            utilisationEnseignants = this.calculerUtilisationRessource(
              nombreEnseignants, 
              abonnement.nombreEnseignantsMax,
              'enseignants'
            );

            // Calculer l'utilisation des apprenants
            utilisationApprenants = this.calculerUtilisationRessource(
              nombreApprenants, 
              abonnement.nombreApprenantsMax,
              'apprenants'
            );

            // Calculer l'utilisation des jeux
            utilisationJeux = this.calculerUtilisationRessource(
              nombreJeux, 
              abonnement.nombreJeuxMax,
              'jeux'
            );

            // Déterminer le statut général
            statutGeneral = this.determinerStatutGeneral([
              utilisationEnseignants.pourcentage,
              utilisationApprenants.pourcentage,
              utilisationJeux.pourcentage
            ]);

          } else {
            statutGeneral = 'Abonnement expiré';
          }
        }

        ecolesAvecUtilisation.push({
          _id: ecole._id,
          libelle: ecole.libelle,
          ville: ecole.ville,
          email: ecole.email,
          telephone: ecole.telephone,
          abonnement: abonnementInfo,
          utilisation: {
            enseignants: utilisationEnseignants,
            apprenants: utilisationApprenants,
            jeux: utilisationJeux
          },
          statutGeneral,
          resume: this.genererResumeEcole(utilisationEnseignants, utilisationApprenants, utilisationJeux),
          derniereAnalyse: new Date().toISOString()
        });
      }

      // Calculer le résumé global
      const resume = this.calculerResumeGlobal(ecolesAvecUtilisation);

      const executionTime = Date.now() - startTime;
      console.log(`✅ [SERVICE] Analyse terminée en ${executionTime}ms`);

      return {
        resume,
        ecoles: ecolesAvecUtilisation,
        totalEcoles: ecolesAvecUtilisation.length,
        executionTime: `${executionTime}ms`,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ [SERVICE] Erreur getEcolesUtilisationAbonnements:', error);
      throw new Error(`Erreur lors de l'analyse des abonnements: ${error.message}`);
    }
  },

  /**
   * ✅ ÉCOLES EN RISQUE
   */
  async getEcolesEnRisque(seuil = 80) {
    try {
      console.log(`🚨 [SERVICE] Recherche écoles > ${seuil}% d'utilisation...`);
      
      const toutesLesEcoles = await this.getEcolesUtilisationAbonnements();
      
      const ecolesEnRisque = toutesLesEcoles.ecoles.filter(ecole => {
        if (!ecole.abonnement) return false;
        
        const pourcentages = [
          ecole.utilisation.enseignants?.pourcentage || 0,
          ecole.utilisation.apprenants?.pourcentage || 0,
          ecole.utilisation.jeux?.pourcentage || 0
        ];
        
        return Math.max(...pourcentages) >= seuil;
      });

      // Trier par niveau de risque (pourcentage le plus élevé d'abord)
      ecolesEnRisque.sort((a, b) => {
        const maxA = Math.max(
          a.utilisation.enseignants?.pourcentage || 0,
          a.utilisation.apprenants?.pourcentage || 0,
          a.utilisation.jeux?.pourcentage || 0
        );
        const maxB = Math.max(
          b.utilisation.enseignants?.pourcentage || 0,
          b.utilisation.apprenants?.pourcentage || 0,
          b.utilisation.jeux?.pourcentage || 0
        );
        return maxB - maxA;
      });

      console.log(`📊 [SERVICE] ${ecolesEnRisque.length} écoles en risque identifiées`);

      return {
        seuil: `${seuil}%`,
        nombreEcolesEnRisque: ecolesEnRisque.length,
        ecoles: ecolesEnRisque,
        recommendations: this.genererRecommandations(ecolesEnRisque),
        niveauxRisque: this.categoriserNiveauxRisque(ecolesEnRisque)
      };

    } catch (error) {
      console.error('❌ [SERVICE] Erreur getEcolesEnRisque:', error);
      throw new Error(`Erreur lors de l'identification des écoles en risque: ${error.message}`);
    }
  },

  /**
   * ✅ RÉSUMÉ GLOBAL
   */
  async getResumeUtilisationGlobale() {
    try {
      console.log('🌍 [SERVICE] Calcul du résumé global...');
      
      const toutesLesEcoles = await this.getEcolesUtilisationAbonnements();
      const ecolesAvecAbonnement = toutesLesEcoles.ecoles.filter(e => e.abonnement);
      
      if (ecolesAvecAbonnement.length === 0) {
        return {
          message: 'Aucune école avec abonnement actif trouvée',
          stats: null,
          suggestions: [
            'Vérifier la configuration des abonnements',
            'Contacter les écoles pour renouvellement',
            'Analyser les raisons de non-souscription'
          ]
        };
      }

      // Calculer les moyennes d'utilisation
      const moyennes = {
        enseignants: this.calculerMoyenneUtilisation(ecolesAvecAbonnement, 'enseignants'),
        apprenants: this.calculerMoyenneUtilisation(ecolesAvecAbonnement, 'apprenants'),
        jeux: this.calculerMoyenneUtilisation(ecolesAvecAbonnement, 'jeux')
      };

      // Répartition par statut
      const repartitionStatuts = this.calculerRepartitionStatuts(toutesLesEcoles.ecoles);

      // Calculer les métriques financières
      const metriquesFinancieres = this.calculerMetriquesFinancieres(ecolesAvecAbonnement);

      console.log('✅ [SERVICE] Résumé global calculé');

      return {
        totalEcoles: toutesLesEcoles.totalEcoles,
        ecolesAvecAbonnement: ecolesAvecAbonnement.length,
        moyennesUtilisation: moyennes,
        repartitionStatuts,
        metriquesFinancieres,
        alertes: {
          ecolesLimiteAtteinte: ecolesAvecAbonnement.filter(e => e.statutGeneral === 'Limite atteinte').length,
          ecolesCritiques: ecolesAvecAbonnement.filter(e => e.statutGeneral === 'Critique (>90%)').length,
          ecolesAttention: ecolesAvecAbonnement.filter(e => e.statutGeneral === 'Attention (>80%)').length,
          urgencesUpgrade: ecolesAvecAbonnement.filter(e => 
            e.utilisation.enseignants?.pourcentage >= 95 ||
            e.utilisation.apprenants?.pourcentage >= 95 ||
            e.utilisation.jeux?.pourcentage >= 95
          ).length
        },
        recommandationsGenerales: this.genererRecommandationsGenerales(moyennes, repartitionStatuts)
      };

    } catch (error) {
      console.error('❌ [SERVICE] Erreur getResumeUtilisationGlobale:', error);
      throw new Error(`Erreur lors du calcul du résumé global: ${error.message}`);
    }
  },

  /**
   * ✅ ÉCOLE SPÉCIFIQUE
   */
  async getEcoleUtilisationStats(ecoleId) {
    try {
      console.log(`🏫 [SERVICE] Analyse école spécifique: ${ecoleId}`);
      
      const toutesLesEcoles = await this.getEcolesUtilisationAbonnements();
      const ecoleStats = toutesLesEcoles.ecoles.find(e => e._id.toString() === ecoleId);

      if (!ecoleStats) {
        return null;
      }

      // Ajouter des informations complémentaires pour cette école
      const complementaires = await this.getInfosComplementairesEcole(ecoleId);

      return {
        ...ecoleStats,
        complementaires,
        recommandationsPersonnalisees: this.genererRecommandationsPersonnalisees(ecoleStats),
        comparaisonMoyenne: this.comparerAvecMoyenne(ecoleStats, toutesLesEcoles.resume?.moyennesUtilisation || {})
      };

    } catch (error) {
      console.error('❌ [SERVICE] Erreur getEcoleUtilisationStats:', error);
      throw new Error(`Erreur lors de l'analyse de l'école: ${error.message}`);
    }
  },

  // ===============================================
  // MÉTHODES COMPLÉMENTAIRES
  // ===============================================

  /**
   * 📊 EXPORT CSV
   */
  async exportStatsCSV() {
    try {
      console.log('📄 [SERVICE] Génération du CSV...');
      
      const stats = await this.getEcolesUtilisationAbonnements();
      
      // En-têtes CSV
      const headers = [
        'École',
        'Ville',
        'Email',
        'Abonnement',
        'Prix',
        'Statut',
        'Enseignants Utilisés',
        'Enseignants Limite',
        'Enseignants %',
        'Apprenants Utilisés',
        'Apprenants Limite', 
        'Apprenants %',
        'Jeux Utilisés',
        'Jeux Limite',
        'Jeux %',
        'Statut Général',
        'Jours Restants'
      ];

      // Données CSV
      const rows = stats.ecoles.map(ecole => [
        `"${ecole.libelle}"`,
        `"${ecole.ville || ''}"`,
        `"${ecole.email || ''}"`,
        `"${ecole.abonnement?.nom || 'Aucun'}"`,
        ecole.abonnement?.prix || 0,
        ecole.abonnement ? 'Actif' : 'Inactif',
        ecole.utilisation.enseignants?.utilise || 0,
        ecole.utilisation.enseignants?.limite || 0,
        ecole.utilisation.enseignants?.pourcentage || 0,
        ecole.utilisation.apprenants?.utilise || 0,
        ecole.utilisation.apprenants?.limite || 0,
        ecole.utilisation.apprenants?.pourcentage || 0,
        ecole.utilisation.jeux?.utilise || 0,
        ecole.utilisation.jeux?.limite || 0,
        ecole.utilisation.jeux?.pourcentage || 0,
        `"${ecole.statutGeneral}"`,
        ecole.abonnement?.joursRestants || 0
      ]);

      // Assembler le CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      console.log('✅ [SERVICE] CSV généré avec succès');
      return csvContent;

    } catch (error) {
      console.error('❌ [SERVICE] Erreur exportStatsCSV:', error);
      throw new Error(`Erreur lors de l'export CSV: ${error.message}`);
    }
  },

  /**
   * 📈 TENDANCES
   */
  async getTendancesUtilisation(periode = '3m') {
    try {
      console.log(`📈 [SERVICE] Calcul des tendances pour ${periode}...`);
      
      // Note: Cette méthode nécessiterait un historique des données
      // Pour l'instant, on retourne des données simulées
      return {
        periode,
        message: 'Fonctionnalité tendances en développement',
        donnees: {
          evolutionEnseignants: [],
          evolutionApprenants: [],
          evolutionJeux: [],
          previsions: null
        }
      };

    } catch (error) {
      console.error('❌ [SERVICE] Erreur getTendancesUtilisation:', error);
      throw new Error(`Erreur lors du calcul des tendances: ${error.message}`);
    }
  },

  /**
   * 🔍 RECHERCHE
   */
  async rechercherEcoles(filtres) {
    try {
      console.log('🔍 [SERVICE] Recherche avec filtres:', filtres);
      
      const toutesLesEcoles = await this.getEcolesUtilisationAbonnements();
      
      let ecolesFilterees = toutesLesEcoles.ecoles;

      // Filtrer par statut
      if (filtres.statut) {
        ecolesFilterees = ecolesFilterees.filter(e => 
          e.statutGeneral.toLowerCase().includes(filtres.statut.toLowerCase())
        );
      }

      // Filtrer par ville
      if (filtres.ville) {
        ecolesFilterees = ecolesFilterees.filter(e => 
          e.ville && e.ville.toLowerCase().includes(filtres.ville.toLowerCase())
        );
      }

      // Filtrer par abonnement
      if (filtres.abonnement) {
        ecolesFilterees = ecolesFilterees.filter(e => 
          e.abonnement && e.abonnement.nom.toLowerCase().includes(filtres.abonnement.toLowerCase())
        );
      }

      // Filtrer par plage de pourcentage
      if (filtres.seuil_min || filtres.seuil_max) {
        const seuilMin = parseInt(filtres.seuil_min) || 0;
        const seuilMax = parseInt(filtres.seuil_max) || 100;
        
        ecolesFilterees = ecolesFilterees.filter(e => {
          if (!e.abonnement) return false;
          
          const maxPourcentage = Math.max(
            e.utilisation.enseignants?.pourcentage || 0,
            e.utilisation.apprenants?.pourcentage || 0,
            e.utilisation.jeux?.pourcentage || 0
          );
          
          return maxPourcentage >= seuilMin && maxPourcentage <= seuilMax;
        });
      }

      console.log(`✅ [SERVICE] ${ecolesFilterees.length} écoles trouvées après filtrage`);

      return {
        ecoles: ecolesFilterees,
        totalTrouve: ecolesFilterees.length,
        totalOriginal: toutesLesEcoles.ecoles.length,
        filtresAppliques: filtres
      };

    } catch (error) {
      console.error('❌ [SERVICE] Erreur rechercherEcoles:', error);
      throw new Error(`Erreur lors de la recherche: ${error.message}`);
    }
  },

  /**
   * ⚡ STATS RAPIDES
   */
  async getQuickStats() {
    try {
      const startTime = Date.now();
      console.log('⚡ [SERVICE] Calcul des stats rapides...');
      
      // Comptes rapides en parallèle
      const [
        totalEcoles,
        totalAbonnements,
        ecolesAvecAbonnement
      ] = await Promise.all([
        Ecole.countDocuments(),
        Abonnement.countDocuments(),
        Ecole.countDocuments({ abonnementActuel: { $ne: null } })
      ]);

      const executionTime = Date.now() - startTime;

      return {
        totalEcoles,
        totalAbonnements,
        ecolesAvecAbonnement,
        ecolesSansAbonnement: totalEcoles - ecolesAvecAbonnement,
        tauxAbonnement: totalEcoles > 0 ? Math.round((ecolesAvecAbonnement / totalEcoles) * 100) : 0,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ [SERVICE] Erreur getQuickStats:', error);
      throw new Error(`Erreur lors du calcul des stats rapides: ${error.message}`);
    }
  },

  /**
   * 📅 PLANNING UPGRADES
   */
  async getPlanningUpgrades() {
    try {
      console.log('📅 [SERVICE] Génération du planning des upgrades...');
      
      const ecolesEnRisque = await this.getEcolesEnRisque(75); // Seuil à 75%
      
      const planning = {
        urgent: ecolesEnRisque.ecoles.filter(e => 
          Math.max(
            e.utilisation.enseignants?.pourcentage || 0,
            e.utilisation.apprenants?.pourcentage || 0,
            e.utilisation.jeux?.pourcentage || 0
          ) >= 95
        ),
        priorite: ecolesEnRisque.ecoles.filter(e => {
          const max = Math.max(
            e.utilisation.enseignants?.pourcentage || 0,
            e.utilisation.apprenants?.pourcentage || 0,
            e.utilisation.jeux?.pourcentage || 0
          );
          return max >= 85 && max < 95;
        }),
        surveillance: ecolesEnRisque.ecoles.filter(e => {
          const max = Math.max(
            e.utilisation.enseignants?.pourcentage || 0,
            e.utilisation.apprenants?.pourcentage || 0,
            e.utilisation.jeux?.pourcentage || 0
          );
          return max >= 75 && max < 85;
        })
      };

      return {
        planning,
        resume: {
          urgent: planning.urgent.length,
          priorite: planning.priorite.length,
          surveillance: planning.surveillance.length,
          total: planning.urgent.length + planning.priorite.length + planning.surveillance.length
        },
        actions: {
          urgent: 'Contacter immédiatement pour upgrade',
          priorite: 'Planifier contact dans les 7 jours',
          surveillance: 'Surveiller et contacter dans le mois'
        }
      };

    } catch (error) {
      console.error('❌ [SERVICE] Erreur getPlanningUpgrades:', error);
      throw new Error(`Erreur lors de la génération du planning: ${error.message}`);
    }
  },

  // ===============================================
  // MÉTHODES UTILITAIRES
  // ===============================================

  /**
   * Calcule l'utilisation d'une ressource
   */
  calculerUtilisationRessource(utilise, limite, typeRessource) {
    const limiteReelle = limite || 0;
    const pourcentage = limiteReelle > 0 ? Math.round((utilise / limiteReelle) * 100) : 0;
    
    return {
      utilise,
      limite: limiteReelle,
      restant: Math.max(0, limiteReelle - utilise),
      pourcentage,
      statut: this.getStatutUtilisation(utilise, limiteReelle),
      typeRessource
    };
  },

  /**
   * Détermine le statut d'utilisation
   */
  getStatutUtilisation(utilise, limite) {
    if (!limite || limite === 0) return 'Illimité';
    
    const pourcentage = (utilise / limite) * 100;
    
    if (utilise >= limite) return 'Limite atteinte';
    if (pourcentage >= 90) return 'Critique';
    if (pourcentage >= 80) return 'Attention';
    if (pourcentage >= 50) return 'Modéré';
    return 'Bon';
  },

  /**
   * Détermine le statut général d'une école
   */
  determinerStatutGeneral(pourcentages) {
    const maxPourcentage = Math.max(...pourcentages);
    
    if (maxPourcentage >= 100) return 'Limite atteinte';
    if (maxPourcentage >= 90) return 'Critique (>90%)';
    if (maxPourcentage >= 80) return 'Attention (>80%)';
    if (maxPourcentage >= 50) return 'Modéré (>50%)';
    return 'Bon (<50%)';
  },

  /**
   * Génère le résumé d'une école
   */
  genererResumeEcole(enseignants, apprenants, jeux) {
    if (!enseignants || !apprenants || !jeux) {
      return 'Aucun abonnement actif';
    }
    
    return `Enseignants: ${enseignants.utilise}/${enseignants.limite} | ` +
           `Apprenants: ${apprenants.utilise}/${apprenants.limite} | ` +
           `Jeux: ${jeux.utilise}/${jeux.limite}`;
  },

  /**
   * Calcule le résumé global
   */
  calculerResumeGlobal(ecoles) {
    const ecolesAvecAbonnement = ecoles.filter(e => e.abonnement);
    
    return {
      totalEcoles: ecoles.length,
      ecolesAvecAbonnement: ecolesAvecAbonnement.length,
      ecolesSansAbonnement: ecoles.filter(e => !e.abonnement).length,
      ecolesExpires: ecoles.filter(e => e.statutGeneral === 'Abonnement expiré').length,
      revenuMensuelTotal: ecolesAvecAbonnement.reduce((sum, e) => sum + (e.abonnement?.prix || 0), 0),
      repartitionStatuts: {
        'Bon (<50%)': ecoles.filter(e => e.statutGeneral === 'Bon (<50%)').length,
        'Modéré (>50%)': ecoles.filter(e => e.statutGeneral === 'Modéré (>50%)').length,
        'Attention (>80%)': ecoles.filter(e => e.statutGeneral === 'Attention (>80%)').length,
        'Critique (>90%)': ecoles.filter(e => e.statutGeneral === 'Critique (>90%)').length,
        'Limite atteinte': ecoles.filter(e => e.statutGeneral === 'Limite atteinte').length
      }
    };
  },

  /**
   * Calcule la moyenne d'utilisation
   */
  calculerMoyenneUtilisation(ecoles, typeRessource) {
    const utilisations = ecoles
      .filter(e => e.utilisation[typeRessource])
      .map(e => e.utilisation[typeRessource].pourcentage);
    
    if (utilisations.length === 0) return 0;
    
    const moyenne = utilisations.reduce((sum, val) => sum + val, 0) / utilisations.length;
    return Math.round(moyenne);
  },

  /**
   * Génère des recommandations
   */
  genererRecommandations(ecolesEnRisque) {
    const recommendations = [];
    
    ecolesEnRisque.forEach(ecole => {
      const recommandationsEcole = [];
      
      if (ecole.utilisation.enseignants?.pourcentage >= 80) {
        recommandationsEcole.push('Envisager un upgrade d\'abonnement pour plus d\'enseignants');
      }
      if (ecole.utilisation.apprenants?.pourcentage >= 80) {
        recommandationsEcole.push('Limite d\'apprenants bientôt atteinte');
      }
      if (ecole.utilisation.jeux?.pourcentage >= 80) {
        recommandationsEcole.push('Quota de jeux presque épuisé');
      }
      
      if (recommandationsEcole.length > 0) {
        recommendations.push({
          ecole: ecole.libelle,
          recommendations: recommandationsEcole
        });
      }
    });
    
    return recommendations;
  },

  /**
   * Informations complémentaires d'une école
   */
  async getInfosComplementairesEcole(ecoleId) {
    try {
      // Récupérer des infos supplémentaires si nécessaire
      return {
        derniereConnexion: null,
        nombreConnexionsRecentes: 0,
        activiteRecente: 'Données non disponibles'
      };
    } catch (error) {
      console.error('❌ Erreur getInfosComplementairesEcole:', error);
      return null;
    }
  },

  /**
   * Recommandations personnalisées
   */
  genererRecommandationsPersonnalisees(ecoleStats) {
    const recommendations = [];
    
    if (ecoleStats.abonnement) {
      const util = ecoleStats.utilisation;
      
      if (util.enseignants?.pourcentage >= 90) {
        recommendations.push({
          type: 'urgent',
          message: 'Limite enseignants critique - Upgrade immédiat recommandé'
        });
      }
      if (util.apprenants?.pourcentage >= 90) {
        recommendations.push({
          type: 'urgent',
          message: 'Limite apprenants critique - Risque de blocage des inscriptions'
        });
      }
      if (util.jeux?.pourcentage >= 90) {
        recommendations.push({
          type: 'attention',
          message: 'Quota jeux presque atteint - Prévoir extension'
        });
      }
    } else {
      recommendations.push({
        type: 'info',
        message: 'Aucun abonnement actif - Contacter pour souscription'
      });
    }
    
    return recommendations;
  },

  /**
   * Comparaison avec la moyenne
   */
  comparerAvecMoyenne(ecoleStats, moyennes) {
    if (!ecoleStats.abonnement || !moyennes) return null;
    
    return {
      enseignants: {
        ecole: ecoleStats.utilisation.enseignants?.pourcentage || 0,
        moyenne: moyennes.enseignants || 0,
        difference: (ecoleStats.utilisation.enseignants?.pourcentage || 0) - (moyennes.enseignants || 0)
      },
      apprenants: {
        ecole: ecoleStats.utilisation.apprenants?.pourcentage || 0,
        moyenne: moyennes.apprenants || 0,
        difference: (ecoleStats.utilisation.apprenants?.pourcentage || 0) - (moyennes.apprenants || 0)
      },
      jeux: {
        ecole: ecoleStats.utilisation.jeux?.pourcentage || 0,
        moyenne: moyennes.jeux || 0,
        difference: (ecoleStats.utilisation.jeux?.pourcentage || 0) - (moyennes.jeux || 0)
      }
    };
  },

  /**
   * Répartition des statuts
   */
  calculerRepartitionStatuts(ecoles) {
    const repartition = {};
    ecoles.forEach(ecole => {
      repartition[ecole.statutGeneral] = (repartition[ecole.statutGeneral] || 0) + 1;
    });
    return repartition;
  },

  /**
   * Métriques financières
   */
  calculerMetriquesFinancieres(ecolesAvecAbonnement) {
    const revenus = ecolesAvecAbonnement.map(e => e.abonnement?.prix || 0);
    const revenuTotal = revenus.reduce((sum, r) => sum + r, 0);
    const revenuMoyen = revenus.length > 0 ? revenuTotal / revenus.length : 0;
    
    return {
      revenuTotal,
      revenuMoyen: Math.round(revenuMoyen),
      nombreAbonnements: ecolesAvecAbonnement.length
    };
  },

  /**
   * Recommandations générales
   */
  genererRecommandationsGenerales(moyennes, repartition) {
    const recommendations = [];
    
    if (moyennes.enseignants > 80) {
      recommendations.push('Moyenne d\'utilisation enseignants élevée - Évaluer les offres d\'upgrade');
    }
    if (moyennes.apprenants > 80) {
      recommendations.push('Moyenne d\'utilisation apprenants élevée - Anticiper les besoins d\'extension');
    }
    
    const critique = repartition['Critique (>90%)'] || 0;
    if (critique > 0) {
      recommendations.push(`${critique} école(s) en situation critique - Action immédiate requise`);
    }
    
    return recommendations;
  }

};

module.exports = subscriptionStatsService;