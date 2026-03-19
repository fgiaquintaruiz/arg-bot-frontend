export const getPublicIp = async (): Promise<string> => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching public IP:', error);
    return 'Error al obtener IP';
  }
};
