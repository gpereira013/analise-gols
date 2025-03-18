import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GoalAnalysis() {
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [capital, setCapital] = useState("");
  const [teamSuggestions, setTeamSuggestions] = useState([]);
  const [selectedTeam1, setSelectedTeam1] = useState(null);
  const [selectedTeam2, setSelectedTeam2] = useState(null);
  const [data, setData] = useState(null);

  const API_KEY = "SUA_CHAVE_DE_API";

  const searchTeams = async (query, setSuggestions) => {
    if (query.length < 3) return;
    console.log("Buscando times para:", query); // Verificar o que está sendo digitado

    const response = await fetch(`https://v3.football.api-sports.io/teams?search=${query}`, {
        method: "GET",
        headers: { "x-apisports-key": API_KEY },
    });

    const data = await response.json();
    console.log("Resposta da API:", data); // Verificar o que a API está retornando

    if (data.response.length > 0) {
        setSuggestions(data.response.map(team => ({ id: team.team.id, name: team.team.name })));
    } else {
        setSuggestions([]);
        alert("Nenhum time encontrado. Tente outro nome!");
    }
};

  const fetchTeamData = async (teamId) => {
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

    return { averageFor, averageAgainst, stddev, goalsFor, goalsAgainst, bttsProbability };
  };

  const analyzeTeams = async () => {
    if (!selectedTeam1 || !selectedTeam2) return alert("Selecione dois times válidos!");
    const team1Data = await fetchTeamData(selectedTeam1.id);
    const team2Data = await fetchTeamData(selectedTeam2.id);
    if (!team1Data || !team2Data) return alert("Erro ao buscar dados dos times!");
    setData([
      { team: selectedTeam1.name, ...team1Data },
      { team: selectedTeam2.name, ...team2Data }
    ]);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Análise de Gols</h1>
      <div className="flex flex-col gap-4 mb-4">
        <Input 
          placeholder="Digite o nome do Time 1"
          value={team1}
          onChange={(e) => {
            setTeam1(e.target.value);
            searchTeams(e.target.value, setTeamSuggestions);
          }}
        />
        {teamSuggestions.length > 0 && (
          <ul className="border p-2 rounded bg-white">
            {teamSuggestions.map((team) => (
              <li key={team.id} className="cursor-pointer p-1 hover:bg-gray-200" onClick={() => { setSelectedTeam1(team); setTeam1(team.name); setTeamSuggestions([]); }}>
                {team.name}
              </li>
            ))}
          </ul>
        )}
        
        <Input 
          placeholder="Digite o nome do Time 2"
          value={team2}
          onChange={(e) => {
            setTeam2(e.target.value);
            searchTeams(e.target.value, setTeamSuggestions);
          }}
        />
        {teamSuggestions.length > 0 && (
          <ul className="border p-2 rounded bg-white">
            {teamSuggestions.map((team) => (
              <li key={team.id} className="cursor-pointer p-1 hover:bg-gray-200" onClick={() => { setSelectedTeam2(team); setTeam2(team.name); setTeamSuggestions([]); }}>
                {team.name}
              </li>
            ))}
          </ul>
        )}
        
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
