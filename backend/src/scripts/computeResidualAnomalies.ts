import fs from 'fs';
import path from 'path';
/*
  computeResidualAnomalies.ts (Phase 11)
  Reads forecast-residuals.json, computes z-score style anomaly per residual set.
  Writes analytics-derived/residual-anomalies.json and prints JSON.
*/
interface Residual { metric: string; residual: number }
interface ResidualFile { residuals: { metric: string; residual: number }[] }

(function main(){
  try {
    const f = path.join(process.cwd(),'analytics-derived','forecast-residuals.json');
    if (!fs.existsSync(f)) { console.error('[residual-anom] missing residual file'); process.exit(0); }
    const parsed: ResidualFile = JSON.parse(fs.readFileSync(f,'utf8'));
    const list: Residual[] = parsed.residuals.map(r => ({ metric: r.metric, residual: r.residual }));
    if (!list.length) { console.log('{}'); return; }
    const values = list.map(r => r.residual);
    const mean = values.reduce((a,b)=>a+b,0)/values.length;
    const variance = values.length > 1 ? values.reduce((a,b)=>a+Math.pow(b-mean,2),0)/(values.length-1) : 0;
    const std = Math.sqrt(variance);
    const anomalies = list.map(r => ({ metric: r.metric, residual: r.residual, score: std>0 ? (r.residual - mean)/std : 0 }));
    const out = { generatedAt: new Date().toISOString(), mean, std, anomalies };
    const dir = path.join(process.cwd(),'analytics-derived');
    fs.writeFileSync(path.join(dir,'residual-anomalies.json'), JSON.stringify(out,null,2));
    console.log(JSON.stringify(out,null,2));
  } catch (e:any) {
    console.error('[residual-anom] failed', e.message);
  }
})();
