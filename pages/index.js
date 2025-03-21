import { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export default function GoalAnalysis() {
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [capital, setCapital] = useState("");
  const [data, setData] = useState(null);

  const API_KEY = "SUA_CHAVE_DE_API";

  const fetchTeamData = async (teamName) => {
    const teamResponse = await fetch(`https://v3.football.api-sports.io/teams?search=${teamName}`, {
      method: "GET",
      headers: { "x-apisports-key": API_KEY },
    });
    const teamData = await teamResponse.json();
    if (teamData.response.length === 0) return null;
    const teamId = teamData.response[0].team.id;

    const matchesResponse = await fetch(`https://v3.football.api-sports.io/fixtures?team=${teamId}&last=10`, {
      method: "GET",
      headers: { "x-apisports-key": API_KEY },
    });
    const matchesData = await matchesResponse.json();
    const goalsFor = matchesData.response.map(match => match.goals.for);
    const goalsAgainst = matchesData.response.map(match => match.goals.against);

    const averageFor = goalsFor.reduce((a, b) => a + b, 0) / goalsFor.length;
    const averageAgainst = goalsAgainst.reduce((a, b) => a + b, 0) / goalsAgainst.length;
    
    const variance = goalsFor.reduce((sum, g) => sum + Math.pow(g - averageFor, 2), 0) / goalsFor.length;
    const stddev = Math.sqrt(variance);
    const bttsProbability = goalsFor.filter(g => g > 0).length / goalsFor.length;

    return { team: teamName, averageFor, averageAgainst, stddev, goalsFor, goalsAgainst, bttsProbability };
  };

  const analyzeTeams = async () => {
    const team1Data = await fetchTeamData(team1);
    const team2Data = await fetchTeamData(team2);
    if (!team1Data || !team2Data) return alert("Time não encontrado!");
    setData([team1Data, team2Data]);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Análise de Gols</h1>
      <div className="flex flex-col gap-4 mb-4">
        <Input placeholder="Digite o nome do Time 1" value={team1} onChange={(e) => setTeam1(e.target.value)} />
        <Input placeholder="Digite o nome do Time 2" value={team2} onChange={(e) => setTeam2(e.target.value)} />
        <Input placeholder="Capital disponível" type="number" value={capital} onChange={(e) => setCapital(e.target.value)} />
        <Button onClick={analyzeTeams} className="bg-blue-500 text-white p-2 rounded">Analisar</Button>
      </div>
      {data && (
        <div className="grid grid-cols-1 gap-4">
          {data.map((team) => (
            <Card key={team.team} className="p-4 border rounded-lg shadow-md">
              <CardContent>
                <h2 className="text-xl font-semibold text-center">{team.team}</h2>
                <p>Média de gols marcados: {team.averageFor.toFixed(2)}</p>
                <p>Média de gols sofridos: {team.averageAgainst.toFixed(2)}</p>
                <p>Desvio padrão: {team.stddev.toFixed(2)}</p>
                <p>Probabilidade de Ambas Marcarem: {(team.bttsProbability * 100).toFixed(2)}%</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
