try {
  rs.initiate();
} catch (e) {
  print("Replica set già inizializzato o errore: " + e);
}
