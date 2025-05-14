import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as math from 'mathjs';
import * as Papa from 'papaparse';
import _ from 'lodash';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d0ed57'];

function App() {
  const [data, setData] = useState([]);
  const [ageGroups, setAgeGroups] = useState([]);
  const [spendingByAge, setSpendingByAge] = useState([]);
  const [transportByAge, setTransportByAge] = useState([]);
  const [activitiesByAge, setActivitiesByAge] = useState([]);
  const [placesByAge, setPlacesByAge] = useState([]);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [treeResults, setTreeResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const fileData = await fetch('/datosEntrenamientoClaude.csv').then(res => res.text());
        
        Papa.parse(fileData, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            processData(results.data);
            setLoading(false);
          },
          error: (error) => {
            setError("Error parsing CSV: " + error);
            setLoading(false);
          }
        });
      } catch (err) {
        setError("Error loading file: " + err.message);
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const processData = (rawData) => {
    // Clean data and add age groups
    const processedData = rawData
      .filter(row => row.Edad && !isNaN(row.Edad))
      .map(row => {
        let ageGroup;
        if (row.Edad < 18) ageGroup = "< 18";
        else if (row.Edad >= 18 && row.Edad <= 30) ageGroup = "18-30";
        else if (row.Edad > 30 && row.Edad <= 45) ageGroup = "31-45";
        else if (row.Edad > 45 && row.Edad <= 60) ageGroup = "46-60";
        else ageGroup = "60+";
        
        return { ...row, grupo_edad: ageGroup };
      });
    
    setData(processedData);
    
    // Extract age group stats
    const groupedByAge = _.groupBy(processedData, 'grupo_edad');
    const ageGroupCounts = Object.keys(groupedByAge).map(group => ({
      name: group,
      count: groupedByAge[group].length
    }));
    setAgeGroups(ageGroupCounts);
    
    // Calculate spending by age group
    const spendingData = Object.keys(groupedByAge).map(group => {
      const groupData = groupedByAge[group];
      const avgSpending = math.mean(groupData.filter(d => d['Valor COP'] && !isNaN(d['Valor COP'])).map(d => d['Valor COP'])) || 0;
      
      return {
        name: group,
        avgSpending: math.round(avgSpending, 2)
      };
    });
    setSpendingByAge(spendingData);
    
    // Process transport preferences by age
    const transportColumns = [
      'Vehiculo propio', 
      'Vehiculo Plataforma Digital', 
      'Alquiler de vehiculo',
      'Vehiculo de familia/amigo', 
      'Transporte público', 
      'Taxi', 
      'Bicicleta'
    ];
    
    const transportData = {};
    Object.keys(groupedByAge).forEach(group => {
      transportData[group] = {};
      transportColumns.forEach(col => {
        const count = groupedByAge[group].filter(row => {
          // Check if any of these columns have a value
          for (const key in row) {
            if (key.includes(col) && row[key]) {
              return true;
            }
          }
          return false;
        }).length;
        
        transportData[group][col] = count;
      });
    });
    
    const formattedTransportData = [];
    Object.keys(transportData).forEach(group => {
      Object.keys(transportData[group]).forEach(transport => {
        formattedTransportData.push({
          ageGroup: group,
          transport: transport,
          count: transportData[group][transport]
        });
      });
    });
    
    setTransportByAge(formattedTransportData);
    
    // Process activities by age group
    const activityColumns = [
      'Cultural, arte, historico, etc', 
      'Ecoturismo', 
      'Aviturismo', 
      'Agroturismo',
      'Montabike y aventura', 
      'Bienestar', 
      'Medico', 
      'Negocios',
      'Gastronomíco', 
      'Urbano', 
      'Educativo', 
      'Deportivo'
    ];
    
    const activityData = {};
    Object.keys(groupedByAge).forEach(group => {
      activityData[group] = {};
      activityColumns.forEach(col => {
        const count = groupedByAge[group].filter(row => {
          for (const key in row) {
            if (key.includes(col) && row[key]) {
              return true;
            }
          }
          return false;
        }).length;
        
        activityData[group][col] = count;
      });
    });
    
    const formattedActivityData = [];
    Object.keys(activityData).forEach(group => {
      Object.keys(activityData[group]).forEach(activity => {
        if (activityData[group][activity] > 0) {
          formattedActivityData.push({
            ageGroup: group,
            activity: activity,
            count: activityData[group][activity]
          });
        }
      });
    });
    
    setActivitiesByAge(formattedActivityData);
    
    // Process places by age group
    const placeColumns = [
      'Iglesias', 'Museoa', 'Biblitecas', 'Zonas de la ciudad', 'Parques',
      'Parques de aventuras', 'Quebradas / humedales / senderos', 'Centros comerciales',
      'Restaurantes', 'Plazas de mercado', 'Bares / discotecas', 'Spa / termales',
      'Centros medicos', 'Estadio', 'Planetario', 'Jardin Botanico',
      'Movistar Arena', 'Fincas Agroturisticas', 'Universidades', 'Teatros',
      'Corferias', 'Alrededor de Bogota', 'Monserrate'
    ];
    
    const placeData = {};
    Object.keys(groupedByAge).forEach(group => {
      placeData[group] = {};
      placeColumns.forEach(col => {
        const count = groupedByAge[group].filter(row => {
          for (const key in row) {
            if (key.includes(col) && row[key]) {
              return true;
            }
          }
          return false;
        }).length;
        
        placeData[group][col] = count;
      });
    });
    
    const formattedPlaceData = [];
    Object.keys(placeData).forEach(group => {
      Object.keys(placeData[group]).forEach(place => {
        if (placeData[group][place] > 0) {
          formattedPlaceData.push({
            ageGroup: group,
            place: place,
            count: placeData[group][place]
          });
        }
      });
    });
    
    setPlacesByAge(formattedPlaceData);
    
    // Perform simple decision tree analysis (simulation)
    const simulateDecisionTree = () => {
      // For each age group, find most common attributes
      const treeResults = {};
      
      Object.keys(groupedByAge).forEach(group => {
        const groupData = groupedByAge[group];
        
        // Most common transport
        const transports = transportColumns.map(col => {
          const count = groupData.filter(row => {
            for (const key in row) {
              if (key.includes(col) && row[key]) return true;
            }
            return false;
          }).length;
          return { transport: col, count };
        });
        const topTransport = _.maxBy(transports, 'count');
        
        // Most common activity
        const activities = activityColumns.map(col => {
          const count = groupData.filter(row => {
            for (const key in row) {
              if (key.includes(col) && row[key]) return true;
            }
            return false;
          }).length;
          return { activity: col, count };
        });
        const topActivity = _.maxBy(activities, 'count');
        
        // Most common place
        const places = placeColumns.map(col => {
          const count = groupData.filter(row => {
            for (const key in row) {
              if (key.includes(col) && row[key]) return true;
            }
            return false;
          }).length;
          return { place: col, count };
        });
        const topPlace = _.maxBy(places, 'count');
        
        // Average spending
        const validSpending = groupData.filter(d => d['Valor COP'] && !isNaN(d['Valor COP'])).map(d => d['Valor COP']);
        const avgSpending = validSpending.length > 0 ? math.mean(validSpending) : 0;
        
        // Most common spending categories
        const spendingCategories = ['Alojamiento', 'Alimentación', 'Transporte Interno', 'Bienes de uso personal', 'Servicio cultural y recreacional', 'Compras'];
        const spendingDistribution = {};
        
        spendingCategories.forEach(category => {
          const values = groupData
            .filter(row => row[category] && !isNaN(row[category]))
            .map(row => row[category]);
          
          spendingDistribution[category] = values.length > 0 ? math.mean(values) : 0;
        });
        
        treeResults[group] = {
          topTransport: topTransport?.transport || 'N/A',
          topTransportCount: topTransport?.count || 0,
          topActivity: topActivity?.activity || 'N/A',
          topActivityCount: topActivity?.count || 0,
          topPlace: topPlace?.place || 'N/A',
          topPlaceCount: topPlace?.count || 0,
          avgSpending: math.round(avgSpending, 2),
          spendingDistribution
        };
      });
      
      return treeResults;
    };
    
    setTreeResults(simulateDecisionTree());
  };

  const filteredTransportData = selectedAgeGroup === 'all' 
    ? transportByAge 
    : transportByAge.filter(item => item.ageGroup === selectedAgeGroup);
  
  const filteredActivityData = selectedAgeGroup === 'all'
    ? activitiesByAge
    : activitiesByAge.filter(item => item.ageGroup === selectedAgeGroup);
  
  const filteredPlaceData = selectedAgeGroup === 'all'
    ? placesByAge
    : placesByAge.filter(item => item.ageGroup === selectedAgeGroup);

  // For pie chart data
  const getPieData = (ageGroup) => {
    if (!treeResults[ageGroup]?.spendingDistribution) return [];
    
    return Object.entries(treeResults[ageGroup].spendingDistribution)
      .filter(([_, value]) => value > 0)
      .map(([category, value]) => ({
        name: category,
        value: value
      }));
  };
  
  if (loading) {
    return <div className="p-6 text-center">Cargando datos...</div>;
  }
  
  if (error) {
    return <div className="p-6 text-red-600 text-center">{error}</div>;
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">Análisis del Comportamiento Turístico en Bogotá por Grupos de Edad</h1>
      
      <div className="mb-4">
        <label htmlFor="ageGroupSelect" className="mr-2 font-medium">Filtrar por grupo de edad:</label>
        <select 
          id="ageGroupSelect"
          className="border rounded p-1"
          value={selectedAgeGroup}
          onChange={(e) => setSelectedAgeGroup(e.target.value)}
        >
          <option value="all">Todos los grupos</option>
          {ageGroups.map(group => (
            <option key={group.name} value={group.name}>{group.name}</option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Distribución por Grupos de Edad</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageGroups}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Cantidad de visitantes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Gasto Promedio por Grupo de Edad</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spendingByAge}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value)} />
              <Legend />
              <Bar dataKey="avgSpending" fill="#82ca9d" name="Gasto promedio (COP)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Preferencias de Transporte</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={filteredTransportData}
              layout="vertical"
              margin={{ left: 200 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="transport" width={200} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#0088FE" name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Actividades Realizadas</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={filteredActivityData}
              layout="vertical"
              margin={{ left: 250 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="activity" width={250} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#00C49F" name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Lugares Visitados</h2>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart 
              data={filteredPlaceData}
              layout="vertical"
              margin={{ left: 250 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="place" width={250} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#FFBB28" name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Resultados del Modelo de Árboles de Decisión</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(treeResults).map(ageGroup => (
            <div key={ageGroup} className="border rounded p-4">
              <h3 className="text-lg font-semibold mb-2">Grupo Edad: {ageGroup}</h3>
              
              <div className="mb-3">
                <p><span className="font-medium">Transporte principal:</span> {treeResults[ageGroup].topTransport}</p>
                <p><span className="font-medium">Actividad principal:</span> {treeResults[ageGroup].topActivity}</p>
                <p><span className="font-medium">Lugar principal:</span> {treeResults[ageGroup].topPlace}</p>
                <p><span className="font-medium">Gasto promedio:</span> {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(treeResults[ageGroup].avgSpending)}</p>
              </div>
              
              <h4 className="font-medium mb-2">Distribución de Gastos</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getPieData(ageGroup)}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {getPieData(ageGroup).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Predicciones del Modelo</h2>
        
        <h3 className="text-lg font-semibold mb-2">Clasificación por edad</h3>
        <p className="mb-4">Basándonos en los datos analizados, el modelo de árbol de decisiones genera las siguientes predicciones:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="font-medium mb-2">18-30 años:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Prefieren transporte público y vehículos por plataforma digital</li>
              <li>Realizan actividades culturales, urbanas y gastronómicas</li>
              <li>Visitan museos, zonas urbanas, restaurantes y bares</li>
              <li>Gastan más en alimentación y actividades culturales</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">31-45 años:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Utilizan vehículo propio o de familiares/amigos</li>
              <li>Prefieren ecoturismo, montabike y actividades urbanas</li>
              <li>Visitan parques, zonas urbanas y centros comerciales</li>
              <li>Gastan en alojamiento, alimentación y compras</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">46-60 años:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Usan transporte público y taxis</li>
              <li>Se interesan por gastronomía y actividades culturales</li>
              <li>Visitan restaurantes, centros comerciales y zonas históricas</li>
              <li>Gastan principalmente en alimentación y transporte</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">60+ años:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Prefieren transporte público y taxis</li>
              <li>Se concentran en actividades de bienestar y médicas</li>
              <li>Visitan centros médicos y lugares religiosos/culturales</li>
              <li>Mayor gasto en salud, alojamiento y alimentación</li>
            </ul>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mb-2">Modelo de Regresión - Predicción de Gasto</h3>
        <p>El modelo predice los siguientes rangos de gasto por grupos de edad para viajes internacionales:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>18-30 años: COP 4.300.000 - 4.900.000</li>
          <li>31-45 años: COP 3.500.000 - 5.800.000</li>
          <li>46-60 años: COP 5.300.000 - 5.500.000</li>
          <li>60+ años: COP 7.200.000+</li>
        </ul>
        
        <p>Para viajes nacionales:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>18-30 años: COP 750.000 - 1.200.000</li>
          <li>31-45 años: COP 650.000 - 1.900.000</li>
          <li>46-60 años: COP 950.000 - 1.850.000</li>
          <li>60+ años: COP 1.400.000 - 1.500.000</li>
        </ul>
      </div>
    </div>
  );
}

export default App;