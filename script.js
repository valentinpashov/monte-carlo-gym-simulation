function getNormalRandom(mean, stdDev) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
}

let myChart = null;

function runMonteCarlo() {
    const btn = document.querySelector('button');
    const sumDiv = document.getElementById('summary');
    
    btn.disabled = true;
    btn.innerText = "Simuliere... Bitte warten...";
    sumDiv.style.display = 'block';
    sumDiv.innerHTML = "Berechnung läuft (2.000.000 Simulationen)";

    setTimeout(() => {
        const iterations = 100000; 
        const numRuns = 20;        
        
        const bCust = parseFloat(document.getElementById('baseCust').value);
        const cDev  = parseFloat(document.getElementById('custDev').value);
        const rPerC = parseFloat(document.getElementById('revPerCust').value);
        const rDev  = parseFloat(document.getElementById('revDev').value);
        const fCost = parseFloat(document.getElementById('fixCosts').value);
        const vCost = parseFloat(document.getElementById('varCosts').value);

        let allRunsResults = []; 
        const monthLabels = ["Jan", "Feb", "Mrz", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

        // 20 separaten Durchläufe(Runs) mit jeweils 100.000 Iterationen
        for (let r = 0; r < numRuns; r++) {
            let currentRunMonthly = new Array(12).fill(0);
            for (let i = 0; i < iterations; i++) {
                for (let m = 0; m < 12; m++) {
                    // Koeffizienten
                    let seasonCoeff = (m < 2) ? 1.5 : (m < 5) ? 1.2 : (m < 8) ? 0.6 : 1.0;
                    
                    let simulatedCustomers = Math.max(0, getNormalRandom(bCust * seasonCoeff, cDev * seasonCoeff));
                    
                    let totalRevenue = getNormalRandom(simulatedCustomers * rPerC, Math.sqrt(simulatedCustomers) * rDev);
                    
                    // Zielfunktion: Gewinn = Umsatz - (Fixkosten + Variable Kosten)
                    let currentCosts = fCost + (vCost * simulatedCustomers);
                    currentRunMonthly[m] += (totalRevenue - currentCosts);
                }
            }
            allRunsResults.push(currentRunMonthly.map(val => val / iterations));
        }

        // Mittelwert und Standardabweichung für jeden Monat berechnen
        let finalMeans = new Array(12).fill(0);
        let finalStdDevs = new Array(12).fill(0);

        for (let m = 0; m < 12; m++) {
            let values = allRunsResults.map(run => run[m]);
            let mean = values.reduce((a, b) => a + b, 0) / numRuns;
            finalMeans[m] = mean;
            
            let squareDiffs = values.map(v => Math.pow(v - mean, 2));
            finalStdDevs[m] = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / numRuns);
        }

        // Summary
        let annualProfits = allRunsResults.map(run => run.reduce((a, b) => a + b, 0));
        let avgYearlyProfit = annualProfits.reduce((a, b) => a + b, 0) / numRuns;
        let minYearlyProfit = Math.min(...annualProfits);
        let maxYearlyProfit = Math.max(...annualProfits);

        updateUI(finalMeans, finalStdDevs, avgYearlyProfit, minYearlyProfit, maxYearlyProfit, monthLabels, numRuns, iterations);
        
        btn.disabled = false;
        btn.innerText = "Simulation starten (100.000 Iterationen x 20 Läufe)";
    }, 50);
}

function updateUI(means, stdDevs, avgYearly, minYearly, maxYearly, labels, runs, iters) {
    const sumDiv = document.getElementById('summary');
    
    // Summary
    sumDiv.innerHTML = `
        <strong>Statistik:</strong><br>
        • Erwarteter Jahresgewinn (Mittelwert): <b>${avgYearly.toFixed(2)} €</b><br>
        • Durchschnittlicher monatlicher Gewinn: <b>${(avgYearly / 12).toFixed(2)} €</b><br>
        • Minimaler monatlicher Gewinn: <b>${(minYearly / 12).toFixed(2)} €</b><br>
        • Maximaler monatlicher Gewinn: <b>${(maxYearly / 12).toFixed(2)} €</b><br>
        • Durchschnittliche monatliche Abweichung: <b>±${(stdDevs.reduce((a,b)=>a+b,0)/12).toFixed(2)} €</b>
    `;

    const ctx = document.getElementById('canvasChart').getContext('2d');
    if (myChart) myChart.destroy();
    
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Mittelwert Gewinn (€)',
                data: means.map(v => v.toFixed(2)),
                backgroundColor: means.map(v => v > 0 ? '#27ae60' : '#e74c3c')
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
    
                    }
                }
            }
        }
    });
}