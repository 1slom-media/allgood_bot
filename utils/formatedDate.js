function getFormattedDate(dateString) {
    // Agar argument berilmagan bo'lsa, hozirgi sanani olish
    const now = dateString ? new Date(dateString) : new Date();
    
    const day = now.getDate();
    const month = now.getMonth() + 1; // Oyning indeksi 0 dan boshlanadi
    const year = now.getFullYear();
    const hours = now.getHours();
    const minutes = now.getMinutes();
  
    // Formatta chiqarish: "19.11.2024 1:38"
    const formattedDate = `${day < 10 ? '0' + day : day}.${month < 10 ? '0' + month : month}.${year} ${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
  
    return formattedDate;
  }

export default getFormattedDate;