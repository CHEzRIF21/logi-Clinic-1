import React, { useEffect, useState } from 'react';
import { 
  AccessTime, 
  Science, 
  Warning, 
  CheckCircle, 
  Error as ErrorIcon,
  Refresh,
  TrendingUp,
  TrendingDown,
  Remove
} from '@mui/icons-material';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/shadcn/card';
import { Badge } from '../ui/shadcn/badge';
import { Alert, AlertTitle, AlertDescription } from '../ui/shadcn/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/shadcn/table';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { LaboratoireService, LabPrelevement, LabAnalyse, LabAlerte } from '../../services/laboratoireService';

interface LabDashboardModernProps {
  onSelectPrelevement?: (prelevement: LabPrelevement) => void;
  onSelectAnalyse?: (analyse: LabAnalyse) => void;
}

const LabDashboardModern: React.FC<LabDashboardModernProps> = ({ onSelectPrelevement, onSelectAnalyse }) => {
  const [fileAttente, setFileAttente] = useState<LabPrelevement[]>([]);
  const [examensEnCours, setExamensEnCours] = useState<LabAnalyse[]>([]);
  const [alertes, setAlertes] = useState<LabAlerte[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [attente, enCours, alertesData] = await Promise.all([
        LaboratoireService.getFileAttentePrelevements(),
        LaboratoireService.getExamensEnCours(),
        LaboratoireService.getAlertes('nouvelle')
      ]);
      setFileAttente(attente);
      setExamensEnCours(enCours);
      setAlertes(alertesData);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPrioriteColor = (priorite: LabAlerte['priorite']) => {
    switch (priorite) {
      case 'critique': return 'destructive';
      case 'haute': return 'warning';
      case 'moyenne': return 'info';
      default: return 'default';
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'termine': return 'success';
      case 'en_cours': return 'info';
      case 'en_attente': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">File d'attente</CardTitle>
            <CardDescription className="text-2xl font-bold">{fileAttente.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AccessTime className="h-4 w-4" />
              <span>Prélèvements en attente</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Examens en cours</CardTitle>
            <CardDescription className="text-2xl font-bold">{examensEnCours.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Science className="h-4 w-4" />
              <span>Tests non validés</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alertes critiques</CardTitle>
            <CardDescription className="text-2xl font-bold">
              {alertes.filter(a => a.priorite === 'critique').length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ErrorIcon className="h-4 w-4" />
              <span>Nécessitent attention</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total alertes</CardTitle>
            <CardDescription className="text-2xl font-bold">{alertes.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Warning className="h-4 w-4" />
              <span>Toutes alertes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File d'attente */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>File d'attente - Prélèvements</CardTitle>
              <CardDescription>Patients en attente de prélèvement</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={loadDashboard}
              className="h-8 w-8"
            >
              <Refresh className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {fileAttente.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun prélèvement en attente
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fileAttente.slice(0, 10).map((prelevement) => (
                    <TableRow
                      key={prelevement.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onSelectPrelevement?.(prelevement)}
                    >
                      <TableCell className="font-medium">{prelevement.code_unique}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{prelevement.type_echantillon}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(prelevement.date_prelevement).toLocaleString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {prelevement.statut_echantillon === 'rejete' ? (
                          <Badge variant="destructive">Rejeté</Badge>
                        ) : (
                          <Badge variant="success">Conforme</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Examens en cours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Examens en cours</CardTitle>
              <CardDescription>Tests lancés mais non validés</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={loadDashboard}
              className="h-8 w-8"
            >
              <Refresh className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {examensEnCours.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun examen en cours
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paramètre</TableHead>
                    <TableHead>Résultat</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examensEnCours.slice(0, 10).map((analyse) => (
                    <TableRow
                      key={analyse.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        analyse.est_pathologique && "bg-red-50 dark:bg-red-950/20"
                      )}
                      onClick={() => onSelectAnalyse?.(analyse)}
                    >
                      <TableCell className="font-medium">{analyse.parametre}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            analyse.est_pathologique && "font-bold text-red-600 dark:text-red-400"
                          )}>
                            {analyse.type_resultat === 'quantitatif' 
                              ? `${analyse.valeur_numerique} ${analyse.unite || ''}`.trim()
                              : analyse.valeur_qualitative || 'En attente'}
                          </span>
                          {analyse.evolution === 'amelioration' && <TrendingDown className="h-4 w-4 text-green-500" />}
                          {analyse.evolution === 'aggravation' && <TrendingUp className="h-4 w-4 text-red-500" />}
                          {analyse.evolution === 'stabilite' && <Remove className="h-4 w-4 text-blue-500" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatutColor(analyse.statut) as any}>
                          {analyse.statut}
                        </Badge>
                        {analyse.est_pathologique && (
                          <Badge variant="destructive" className="ml-2">Pathologique</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Alertes</CardTitle>
            <CardDescription>Notifications importantes du laboratoire</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={loadDashboard}
            className="h-8 w-8"
          >
            <Refresh className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {alertes.length === 0 ? (
            <Alert variant="success">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Aucune alerte</AlertTitle>
              <AlertDescription>
                Tous les systèmes fonctionnent normalement.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {alertes.map((alerte) => (
                <Alert
                  key={alerte.id}
                  variant={getPrioriteColor(alerte.priorite) as any}
                  className="flex items-start justify-between"
                >
                  <div className="flex-1">
                    <AlertTitle className="flex items-center gap-2">
                      {alerte.type_alerte === 'resultat_critique' && <ErrorIcon className="h-4 w-4" />}
                      {alerte.type_alerte === 'appareil_defaut' && <Warning className="h-4 w-4" />}
                      {alerte.type_alerte === 'stock_critique' && <Warning className="h-4 w-4" />}
                      {alerte.titre}
                      <Badge variant={getPrioriteColor(alerte.priorite) as any} className="ml-2">
                        {alerte.priorite}
                      </Badge>
                    </AlertTitle>
                    <AlertDescription className="mt-1">
                      {alerte.message}
                      {alerte.appareil && (
                        <div className="mt-1 text-xs">
                          Appareil: {alerte.appareil}
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await LaboratoireService.resoudreAlerte(alerte.id, 'Utilisateur actuel');
                      loadDashboard();
                    }}
                    className="ml-4"
                  >
                    Résoudre
                  </Button>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LabDashboardModern;

