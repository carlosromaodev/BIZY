// ArvoreBinaria.java
// Implementacao de uma Arvore Binaria de Busca (ABB)
// com insercao e percurso em-ordem (in-order).

public class ArvoreBinaria {

    // No da arvore: guarda um valor e referencias para os filhos
    static class No {
        int valor;
        No esquerda;
        No direita;

        /**
         * Construtor do No.
         * Inicializa o valor do no e deixa as referencias dos filhos como nulas.
         *
         * @param valor O valor armazenado neste no
         */
        No(int valor) {
            this.valor = valor;
        }
    }

    private No raiz;

    // Insere um novo valor respeitando a propriedade da ABB:
    // menores a esquerda, maiores a direita.
    public void inserir(int valor) {
        raiz = inserirRec(raiz, valor);
    }

    /**
     * Insere recursivamente um valor na subarvore a partir do no atual.
     * Mantém a propriedade de arvore binaria de busca.
     *
     * @param atual 
     * @param valor 
     * @return 
     */
    private No inserirRec(No atual, int valor) {
        if (atual == null) {
            return new No(valor);
        }
        if (valor < atual.valor) {
            atual.esquerda = inserirRec(atual.esquerda, valor);
        } else if (valor > atual.valor) {
            atual.direita = inserirRec(atual.direita, valor);
        }
        return atual;
    }

    // Busca um valor: devolve true se existir na arvore
    public boolean buscar(int valor) {
        No atual = raiz;
        while (atual != null) {
            if (valor == atual.valor) return true;
            atual = (valor < atual.valor) ? atual.esquerda : atual.direita;
        }
        return false;
    }

    // Percurso em-ordem: imprime os valores de forma ordenada
    public void emOrdem() {
        emOrdemRec(raiz);
        System.out.println();
    }

    /**
     * Percurso recursivo em-ordem (esquerda, raiz, direita).
     * Imprime os valores em ordem crescente.
     *
     * @param atual O no atual sendo visitado
     */
    private void emOrdemRec(No atual) {
        if (atual == null) return;
        emOrdemRec(atual.esquerda);
        System.out.print(atual.valor + " ");
        emOrdemRec(atual.direita);
    }

    /**
     * Metodo principal: testa a arvore binaria.
     * Insere varios valores, realiza percursos e buscas.
     *
     * @param args Argumentos de linha de comando (não utilizados)
     */
    public static void main(String[] args) {
        ArvoreBinaria arvore = new ArvoreBinaria();
        int[] valores = {50, 30, 70, 20, 40, 60, 80};
        for (int v : valores) {
            arvore.inserir(v);
        }

        System.out.print("Percurso em-ordem: ");
        arvore.emOrdem();
        System.out.println("Buscar 40? " + arvore.buscar(40));
        System.out.println("Buscar 99? " + arvore.buscar(99));
    }
}
