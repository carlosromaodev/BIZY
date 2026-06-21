// EstruturasDados.java
// PARTE PRATICA SIMPLES
// Demonstracao integrada das tres estruturas: Arvore Binaria,
// Dicionario (HashMap) e Grafo (lista de adjacencia + BFS).
// Executar com:  java EstruturasDados.java

import java.util.*;

public class EstruturasDados {

    /* ===================== ARVORE BINARIA DE BUSCA ===================== */
    static class No {
        int valor; No esq, dir;
        No(int v) { valor = v; }
    }
    /**
     * Insere recursivamente um valor na arvore binaria de busca.
     *
     * @param atual O no raiz da subarvore
     * @param valor O valor a ser inserido
     * @return O no atualizado após a insercao
     */
    static No inserir(No atual, int valor) {
        if (atual == null) return new No(valor);
        if (valor < atual.valor) atual.esq = inserir(atual.esq, valor);
        else if (valor > atual.valor) atual.dir = inserir(atual.dir, valor);
        return atual;
    }
    /**
     * Realiza percurso em-ordem na arvore e coloca valores em uma lista.
     *
     * @param atual O no atual sendo visitado
     * @param saida Lista que acumula os valores em ordem
     */
    static void emOrdem(No atual, List<Integer> saida) {
        if (atual == null) return;
        emOrdem(atual.esq, saida);
        saida.add(atual.valor);
        emOrdem(atual.dir, saida);
    }

    /* ===================== GRAFO (LISTA DE ADJACENCIA) ===================== */
    static Map<String, List<String>> grafo = new HashMap<>();
    /**
     * Adiciona uma aresta nao-dirigida entre dois vertices do grafo.
     *
     * @param a Primeiro vertice
     * @param b Segundo vertice
     */
    static void ligar(String a, String b) {
        grafo.computeIfAbsent(a, k -> new ArrayList<>()).add(b);
        grafo.computeIfAbsent(b, k -> new ArrayList<>()).add(a);
    }
    /**
     * Realiza percurso em largura (BFS) a partir de um vertice de origem.
     *
     * @param origem O vertice inicial para o BFS
     * @return Lista com a ordem de visitacao dos vertices
     */
    static List<String> bfs(String origem) {
        List<String> ordem = new ArrayList<>();
        Set<String> visitados = new HashSet<>();
        Queue<String> fila = new LinkedList<>();
        fila.add(origem); visitados.add(origem);
        while (!fila.isEmpty()) {
            String atual = fila.poll();
            ordem.add(atual);
            for (String viz : grafo.getOrDefault(atual, List.of())) {
                if (visitados.add(viz)) fila.add(viz);
            }
        }
        return ordem;
    }

    /**
     * Metodo principal: demonstra o uso de tres estruturas de dados:
     * arvore binaria de busca, dicionario (HashMap) e grafo com BFS.
     *
     * @param args Argumentos de linha de comando (não utilizados)
     */
    public static void main(String[] args) {
        System.out.println("====== DEMONSTRACAO DE ESTRUTURAS DE DADOS ======\n");

        // 1) ARVORE BINARIA
        No raiz = null;
        for (int v : new int[]{50, 30, 70, 20, 40, 60, 80}) raiz = inserir(raiz, v);
        List<Integer> ordenados = new ArrayList<>();
        emOrdem(raiz, ordenados);
        System.out.println("[Arvore Binaria] valores em-ordem (ordenados): " + ordenados);

        // 2) DICIONARIO
        Map<String, Double> notas = new HashMap<>();
        notas.put("Ana", 17.5);
        notas.put("Bruno", 14.0);
        notas.put("Carla", 19.0);
        System.out.println("[Dicionario] nota da Carla: " + notas.get("Carla"));
        System.out.println("[Dicionario] pauta completa: " + notas);

        // 3) GRAFO
        ligar("A", "B"); ligar("A", "C"); ligar("B", "D");
        ligar("C", "D"); ligar("D", "E");
        System.out.println("[Grafo] percurso BFS desde A: " + bfs("A"));

        System.out.println("\n====== FIM DA DEMONSTRACAO ======");
    }
}
