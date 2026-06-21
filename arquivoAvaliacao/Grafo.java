// Grafo.java
// Grafo nao-dirigido representado por lista de adjacencia,
// com percurso em largura (BFS - Breadth-First Search).

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;

public class Grafo {

    // Cada vertice aponta para a lista dos seus vizinhos
    private Map<String, List<String>> adjacencias = new HashMap<>();

    /**
     * Adiciona um novo vertice ao grafo.
     * Se o vertice já existe, nenhuma acao é realizada.
     *
     * @param v O nome do vertice a ser adicionado
     */
    public void adicionarVertice(String v) {
        adjacencias.putIfAbsent(v, new ArrayList<>());
    }

    // Aresta nao-dirigida: liga A-B e B-A
    public void adicionarAresta(String a, String b) {
        adicionarVertice(a);
        adicionarVertice(b);
        adjacencias.get(a).add(b);
        adjacencias.get(b).add(a);
    }

    // Percurso em largura a partir de um vertice de origem
    public void bfs(String origem) {
        List<String> visitados = new ArrayList<>();
        Queue<String> fila = new LinkedList<>();
        fila.add(origem);
        visitados.add(origem);

        System.out.print("BFS a partir de " + origem + ": ");
        while (!fila.isEmpty()) {
            String atual = fila.poll();
            System.out.print(atual + " ");
            for (String vizinho : adjacencias.get(atual)) {
                if (!visitados.contains(vizinho)) {
                    visitados.add(vizinho);
                    fila.add(vizinho);
                }
            }
        }
        System.out.println();
    }

    /**
     * Metodo principal: testa o grafo com operacoes de insercao e BFS.
     *
     * @param args Argumentos de linha de comando (não utilizados)
     */
    public static void main(String[] args) {
        Grafo cidade = new Grafo();
        // Rede de "amizades" / ligacoes entre pontos A, B, C, D, E
        cidade.adicionarAresta("A", "B");
        cidade.adicionarAresta("A", "C");
        cidade.adicionarAresta("B", "D");
        cidade.adicionarAresta("C", "D");
        cidade.adicionarAresta("D", "E");

        cidade.bfs("A");
    }
}
