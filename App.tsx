import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
// Se Feather não estiver disponível, adicione `expo install @expo/vector-icons`

// ----------------------------------------------------------------------
// 1. CONFIGURAÇÃO DA API E INTERFACE
// ----------------------------------------------------------------------

// **IMPORTANTE:** Altere esta URL para o endereço do seu backend.
// - Para Emulador Android: geralmente é http://10.0.2.2:PORT
// - Para Dispositivo Físico: use o IP da sua máquina na rede local
const API_BASE_URL = 'http://192.168.1.6:3000/api/livros';

interface Livro {
  id: number;
  titulo: string;
  autor: string;
  isbn: string;
  anoPublicacao: number;
  disponivel: boolean;
}

type ModalMode = 'view' | 'edit' | 'create';

// ----------------------------------------------------------------------
// 2. COMPONENTE MODAL (Criação, Visualização e Edição)
// ----------------------------------------------------------------------

interface LivroModalProps {
  visible: boolean;
  onClose: () => void;
  mode: ModalMode;
  livro: Livro | null;
  onSave: (data: Partial<Livro>) => void;
  onDelete: (id: number) => void;
  // CORREÇÃO: Adicionada função para mudar o estado do modal no pai
  onSwitchToEdit: () => void;
}

const LivroModal: React.FC<LivroModalProps> = ({
  visible,
  onClose,
  mode,
  livro,
  onSave,
  onDelete,
  onSwitchToEdit, // CORREÇÃO: Destruturação do novo prop
}) => {
  const [formData, setFormData] = useState<Partial<Livro>>({});

  useEffect(() => {
    if (livro && mode !== 'create') {
      // Preenche o formulário/visualização com os dados do livro selecionado
      setFormData(livro);
    } else if (mode === 'create') {
      // Limpa os dados para o modo de criação
      setFormData({
        titulo: '',
        autor: '',
        isbn: '',
        anoPublicacao: new Date().getFullYear(),
        disponivel: true,
      });
    }
  }, [livro, mode]);

  const handleChange = (name: keyof Livro, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Validação básica
    if (!formData.titulo || !formData.autor || !formData.isbn) {
        Alert.alert('Erro', 'Título, Autor e ISBN são obrigatórios.');
        return;
    }

    // Garante que anoPublicacao é um número e tem um valor padrão
    const dataToSave = {
        ...formData,
        anoPublicacao: formData.anoPublicacao ? Number(formData.anoPublicacao) : new Date().getFullYear(),
        disponivel: formData.disponivel !== undefined ? formData.disponivel : true,
    }

    onSave(dataToSave);
    onClose();
  };

  const handleDelete = () => {
    if (livro) {
      Alert.alert(
        'Confirmar Exclusão',
        `Tem certeza que deseja excluir o livro "${livro.titulo}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            onPress: () => {
              onDelete(livro.id);
              onClose();
            },
            style: 'destructive',
          },
        ]
      );
    }
  };

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  const modalTitle =
    mode === 'create'
      ? 'Novo Livro'
      : mode === 'view'
      ? 'Detalhes do Livro'
      : 'Editar Livro';

  if (!visible || (mode !== 'create' && !livro)) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <Text style={modalStyles.modalTitle}>{modalTitle}</Text>

          <ScrollView style={modalStyles.scrollView}>
            {/* Título */}
            <Text style={modalStyles.label}>Título</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.titulo}
              onChangeText={(text) => handleChange('titulo', text)}
              editable={!isViewMode}
            />

            {/* Autor */}
            <Text style={modalStyles.label}>Autor</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.autor}
              onChangeText={(text) => handleChange('autor', text)}
              editable={!isViewMode}
            />

            {/* ISBN */}
            <Text style={modalStyles.label}>ISBN</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.isbn}
              onChangeText={(text) => handleChange('isbn', text)}
              editable={!isViewMode && mode === 'create'} // ISBN não deve ser editável após a criação
              placeholder={mode === 'edit' ? '(Não editável)' : ''}
            />

            {/* Ano Publicação */}
            <Text style={modalStyles.label}>Ano de Publicação</Text>
            <TextInput
              style={modalStyles.input}
              value={String(formData.anoPublicacao || '')}
              onChangeText={(text) => handleChange('anoPublicacao', text)}
              keyboardType="numeric"
              editable={!isViewMode}
            />

            {/* Disponível */}
            <View style={modalStyles.switchContainer}>
              <Text style={modalStyles.label}>Disponível</Text>
              <Switch
                onValueChange={(value) => handleChange('disponivel', value)}
                value={formData.disponivel}
                disabled={isViewMode}
              />
            </View>

            {/* ID do Livro (apenas em visualização/edição) */}
            {livro && <Text style={modalStyles.idText}>ID: {livro.id}</Text>}
          </ScrollView>

          <View style={modalStyles.buttonContainer}>
            <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
              <Text style={modalStyles.textStyle}>Fechar</Text>
            </TouchableOpacity>

            {(mode === 'create' || isEditMode) && (
              <TouchableOpacity
                style={modalStyles.saveButton}
                onPress={handleSave}
              >
                <Text style={modalStyles.textStyle}>Salvar</Text>
              </TouchableOpacity>
            )}

            {isEditMode && (
              <TouchableOpacity
                style={modalStyles.deleteButton}
                onPress={handleDelete}
              >
                <Text style={modalStyles.textStyle}>Excluir</Text>
              </TouchableOpacity>
            )}
            
            {isViewMode && (
              <TouchableOpacity
                style={modalStyles.editButton}
                onPress={onSwitchToEdit} // CORREÇÃO: Usa o novo prop onSwitchToEdit
              >
                <Text style={modalStyles.textStyle}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ----------------------------------------------------------------------
// 3. COMPONENTE PRINCIPAL (App)
// ----------------------------------------------------------------------

export default function App() {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    visible: boolean;
    mode: ModalMode;
    livro: Livro | null;
  }>({
    visible: false,
    mode: 'view',
    livro: null,
  });

  const fetchLivros = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`Erro de rede: ${response.status}`);
      }
      const data: Livro[] = await response.json();
      setLivros(data);
    } catch (err: any) {
      console.error('Erro ao buscar livros:', err);
      setError(`Falha ao buscar dados: ${err.message}. Verifique o servidor.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLivros();
  }, [fetchLivros]);

  const handleSave = async (data: Partial<Livro>) => {
    setLoading(true);
    setError(null);

    const isCreating = modal.mode === 'create';
    const url = isCreating ? API_BASE_URL : `${API_BASE_URL}/${data.id}`;
    const method = isCreating ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido.' }));
        throw new Error(errorData.message || 'Falha na operação.');
      }

      // Atualiza a lista após a operação
      await fetchLivros(); 
      Alert.alert('Sucesso', `Livro ${isCreating ? 'criado' : 'atualizado'} com sucesso!`);
    } catch (err: any) {
      console.error(`Erro ao ${isCreating ? 'criar' : 'atualizar'} livro:`, err);
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (response.status !== 204) { // 204 No Content é o esperado para DELETE bem-sucedido
        throw new Error('Falha ao excluir o livro.');
      }

      await fetchLivros(); // Atualiza a lista após a exclusão
      Alert.alert('Sucesso', 'Livro excluído com sucesso!');
    } catch (err: any) {
      console.error('Erro ao deletar livro:', err);
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: ModalMode, livro: Livro | null = null) => {
    setModal({ visible: true, mode, livro });
  };

  const closeModal = () => {
    setModal({ visible: false, mode: 'view', livro: null });
  };

  // ----------------------------------------------------------------------
  // 4. RENDERING E ESTRUTURA DA LISTA
  // ----------------------------------------------------------------------

  const renderLivroItem = ({ item }: { item: Livro }) => (
    <View style={listStyles.itemContainer}>
      <View style={listStyles.textContainer}>
        <Text style={listStyles.titulo}>{item.titulo}</Text>
        <Text style={listStyles.autor}>Autor: {item.autor}</Text>
        <Text style={listStyles.disponivel}>
          {item.disponivel ? '✅ Disponível' : '❌ Indisponível'}
        </Text>
      </View>
      <View style={listStyles.buttonsContainer}>
        <TouchableOpacity
          style={listStyles.button}
          onPress={() => openModal('view', item)}
        >
          <Feather name="eye" size={20} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={listStyles.button}
          onPress={() => openModal('edit', item)}
        >
          <Feather name="edit" size={20} color="#ffc107" />
        </TouchableOpacity>
        <TouchableOpacity
          style={listStyles.button}
          onPress={() => handleDelete(item.id)}
        >
          <Feather name="trash-2" size={20} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Biblioteca Virtual 📚</Text>
      
      {/* Botão de Adicionar */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => openModal('create')}
      >
        <Feather name="plus-circle" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Adicionar Novo Livro</Text>
      </TouchableOpacity>

      {/* Indicadores de Estado */}
      {loading && <ActivityIndicator size="large" color="#007bff" style={styles.indicator} />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Lista de Livros */}
      {!loading && !error && (
        <FlatList
          data={livros}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderLivroItem}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum livro cadastrado.</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
          style={styles.list}
        />
      )}

      {/* Modal Único */}
      <LivroModal
        visible={modal.visible}
        onClose={closeModal}
        mode={modal.mode}
        livro={modal.livro}
        onSave={handleSave}
        onDelete={handleDelete}
        // CORREÇÃO: Passa o callback para mudar o modo do modal no componente pai
        onSwitchToEdit={() => setModal(prev => ({ ...prev, mode: 'edit' }))} 
      />

      <StatusBar style="auto" />
    </View>
  );
}

// ----------------------------------------------------------------------
// 5. ESTILOS
// ----------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
    paddingHorizontal: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  indicator: {
    marginVertical: 20,
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
    marginVertical: 20,
    padding: 10,
    backgroundColor: '#f8d7da',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6c757d',
  },
  list: {
    flex: 1,
  }
});

const listStyles = StyleSheet.create({
  itemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 5,
    borderLeftColor: '#007bff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
  },
  autor: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 5,
  },
  disponivel: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
    marginTop: 5,
  },
  buttonsContainer: {
    flexDirection: 'row',
  },
  button: {
    marginLeft: 15,
    padding: 5,
  },
});

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#343a40',
  },
  scrollView: {
    maxHeight: 300,
  },
  label: {
    marginTop: 10,
    marginBottom: 5,
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  input: {
    height: 40,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#f1f3f5',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 5,
    backgroundColor: '#e9ecef',
  },
  idText: {
    marginTop: 10,
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  closeButton: {
    backgroundColor: '#6c757d',
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    flex: 1,
  },
  editButton: {
    backgroundColor: '#ffc107',
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    flex: 1,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});