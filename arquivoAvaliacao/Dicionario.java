// Dicionario.java
// Exemplo de uso de um Dicionario (estrutura chave-valor)
// em Java atraves da classe HashMap.

import java.util.HashMap;
import java.util.Map;

public class Dicionario {

    /**
     * Metodo principal: demonstra o uso de um dicionario (HashMap).
     * Insere, acessa, atualiza e remove pares chave-valor.
     *
     * @param args Argumentos de linha de comando (não utilizados)
     */
    public static void main(String[] args) {
        // Dicionario que associa o nome de um aluno (chave)
        // a sua nota final (valor).
        Map<String, Double> notas = new HashMap<>();

        // Insercao de pares chave-valor
        notas.put("Ana", 17.5);
        notas.put("Bruno", 14.0);
        notas.put("Carla", 19.0);
        notas.put("David", 12.5);

        // Acesso direto pela chave (tempo medio O(1))
        System.out.println("Nota da Carla: " + notas.get("Carla"));

        // Verificar se uma chave existe
        System.out.println("Existe 'Bruno'? " + notas.containsKey("Bruno"));

        // Atualizar um valor (a chave e unica)
        notas.put("David", 13.0);
        System.out.println("Nova nota do David: " + notas.get("David"));

        // Remover uma entrada
        notas.remove("Ana");

        // Percorrer todas as entradas do dicionario
        System.out.println("\nPauta final:");
        for (Map.Entry<String, Double> entrada : notas.entrySet()) {
            System.out.println("  " + entrada.getKey() + " -> " + entrada.getValue());
        }
    }
}
