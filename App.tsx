import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import {
  Button,
  FlatList,
  SafeAreaView,
  TextInput,
  Text,
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { Div, Header, Icon, Button as MButton, Modal } from 'react-native-magnus';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

type FullData = {
  proudct: string;
  numberProudcts: number;
  price: number;
  multi?: number;
};

type History = {
  id:string;
  historyName: string,
  fullData: FullData[];
  moneyAmount: number;
  numberProudcts: number;
  price: number;
  proudct: string;
  date: Date;
}

function App(): React.JSX.Element {
  const [fullData, setFullData] = useState<FullData[]>([]);
  const [proudct, setProudct] = useState<string>("");
  const [numberProudcts, setNumberProudect] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [moneyAmount, setMoneyAmount] = useState<number>(0); 
  const [totalSum, setTotalSum] = useState<number>(0);
  const [tag, setTag] = useState<number | null>(null);
  const [remainingMoney, setRemainingMoney] = useState<number | null>(null); 
  const [isArabic, setIsArabic] = useState<boolean>(false);
  const [onlyList, setOnlyList] = useState<boolean>(false);
  const [showHistoryToggle, setShowHistoryToggle] = useState<boolean>(false);
  const [historyData, setHistoryData] = useState<History[]>([]);
  const [historyId, setHistoryId] = useState<string | null>(null)
  const [historyName, setHistoryName] = useState<string>("")
  const [showEditHistoryNameModal, setshowEditHistoryNameModal] = useState<boolean>(false);
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveData();
  }, [moneyAmount, fullData, proudct, numberProudcts, remainingMoney, isArabic, totalSum, price]);

  useEffect(() => {
    I18nManager.forceRTL(true);
  }, [])

  useEffect(() => {
    calculateTotalSum();
  }, [fullData])

  useEffect(() => {
    subtractFromMoney();
  }, [totalSum])

  useEffect(() => {
    if (!isNaN(moneyAmount)) {
      subtractFromMoney();
    }
  }, [moneyAmount])

  useEffect(() => {
    if (isNaN(price)) {
      setPrice(0);
    }
    if (isNaN(numberProudcts)) {
      setNumberProudect(0);
    }
  }, [price, numberProudcts]);

  function fullDataEnter() {
    if (!proudct) {
      Alert.alert("Error", "Product name cannot be empty");
      return;
    }
    const newProduct: FullData = { proudct, numberProudcts, price, multi: price * numberProudcts };
    setFullData((prevData) => [...prevData, newProduct]);
    clear();
    setOnlyList(false);
  }

  function clear() {
    setPrice(0);
    setNumberProudect(0);
    setProudct("");
  }

  function toggleEdit(index: number) {
    setTag(tag === index ? null : index);
  }

  function updateProduct(index: number, key: keyof FullData, value: any) {
    setFullData((prevData) =>
      prevData.map((product, idx) => {
        if (idx === index) {
          const updatedProduct = { ...product, [key]: value };
          if (key === "numberProudcts" || key === "price") {
            updatedProduct.multi = updatedProduct.price * updatedProduct.numberProudcts;
          }
          return updatedProduct;
        }
        return product;
      })
    );
  }

  function incrementProductQuantity(index: number) {
    setFullData((prevData) =>
      prevData.map((product, idx) => {
        if (idx === index) {
          const newNumber = product.numberProudcts + 1;
          return { ...product, numberProudcts: newNumber, multi: product.price * newNumber };
        }
        return product;
      })
    );
  }

  function subtractedProductQuantity(index: number) {
    setFullData((prevData) =>
      prevData.map((product, idx) => {
        if (idx === index) {
          const newNumber = product.numberProudcts - 1;
          return { ...product, numberProudcts: newNumber, multi: product.price * newNumber };
        }
        return product;
      })
    );
  }

  function deleteCard(index: number) {
    
      Alert.alert( isArabic? "تحذير": "WARNING", isArabic? "هل أنت متأكد من رغبتك في حذف هذه البطاقة؟": "Are you sure you want to delete this item ?",
        [
          {
            text: isArabic? "أحذف" : "Delete" ,
            onPress: async () => {
              await saveInHistory()
              setFullData((prevData) => prevData.filter((_, idx) => idx !== index));
            }
          },
          {
            text: isArabic? "غير متأكد" : "Not sure",
            onPress: () => console.log( isArabic? "تمام" : "sure")
          }
        ]
      );
  }

  function calculateTotalSum() {
    const total = fullData.reduce((sum, product) => sum + (product.multi || 0), 0);
    setTotalSum(total);
  }

  function subtractFromMoney() {
    const remaining = moneyAmount - totalSum;
    setRemainingMoney(remaining);
  }

  function lang() {
    if (isArabic === false) {
      setIsArabic(true)
    } else setIsArabic(false)
  }

  function showOnlyList() {

    if (onlyList === false) {
      setOnlyList(true)
    } else setOnlyList(false)
  }

  function sanitizeNumericInput(text: string): number {
    const sanitizedText = text.replace(/[^0-9.]/g, '');
  
    const cleanText = sanitizedText.split('.').slice(0, 2).join('.');
  
    return parseFloat(cleanText) || 0;
  }

  const handlePriceChange = (index: number, text: string) => {
    const numericValue = sanitizeNumericInput(text);
    updateProduct(index, 'price', numericValue);
  };
  
  const handleMoneyAmountChange = (text: string) => {
    const numericValue = sanitizeNumericInput(text);
    setMoneyAmount(numericValue);
  };
  
  const handleProductNumberChange = (index: number, text: string) => {
    const numericValue = sanitizeNumericInput(text);
    updateProduct(index, 'numberProudcts', numericValue);
  };

  async function saveData() {
    try {
      await AsyncStorage.setItem('moneyAmount', moneyAmount.toString());
      await AsyncStorage.setItem('fullData', JSON.stringify(fullData));
      await AsyncStorage.setItem('proudct', proudct);
      await AsyncStorage.setItem('numberProudcts', numberProudcts.toString());
      await AsyncStorage.setItem('remainingMoney', remainingMoney?.toString() || '0');
      await AsyncStorage.setItem('isArabic', JSON.stringify(isArabic));
      await AsyncStorage.setItem('totalSum', totalSum.toString());
      await AsyncStorage.setItem('price', price.toString());
    } catch (error) {
      console.log("Error saving data:", error);
    }
  }

  async function loadData() {
    try {
      const savedMoneyAmount = await AsyncStorage.getItem('moneyAmount');
      const savedFullData = await AsyncStorage.getItem('fullData');
      const savedProudct = await AsyncStorage.getItem('proudct');
      const savedNumberProudcts = await AsyncStorage.getItem('numberProudcts');
      const savedRemainingMoney = await AsyncStorage.getItem('remainingMoney');
      const savedIsArabic = await AsyncStorage.getItem('isArabic');
      const savedTotalSum = await AsyncStorage.getItem('totalSum');
      const savedPrice = await AsyncStorage.getItem('price');
      
      if (savedMoneyAmount) setMoneyAmount(Number(savedMoneyAmount));
      if (savedFullData) setFullData(JSON.parse(savedFullData));
      if (savedProudct) setProudct(savedProudct);
      if (savedNumberProudcts) setNumberProudect(Number(savedNumberProudcts));
      if (savedRemainingMoney) setRemainingMoney(Number(savedRemainingMoney));
      if (savedIsArabic) setIsArabic(JSON.parse(savedIsArabic));
      if (savedTotalSum) setTotalSum(Number(savedTotalSum));
      if (savedPrice) setPrice(Number(savedPrice));
    } catch (error) {
      console.log("Error loading data:", error);
    }
  }
  
  async function  editHistory () {
    let history = historyData.map((item) => { 
      if (item.id != historyId) return item
      return { 
        id: item.id,
        historyName: item.historyName,
        fullData,
        moneyAmount,
        numberProudcts,
        price,
        proudct,
        date: item.date
      }
    })
    await AsyncStorage.setItem('history_v3', JSON.stringify(history))
  }

  async function saveInHistory() {
    if (!historyId) 
      {
        const historyStorage = await AsyncStorage.getItem('history_v3')
        const historyList: History[] = historyStorage ? JSON.parse(historyStorage) : [];
        const historyPush: History = {
          id: uuidv4(),
          historyName: historyName,
          fullData,
          moneyAmount,
          numberProudcts,
          price,
          proudct,
          date: new Date() 
      }

      historyList.push(historyPush)
  
      await AsyncStorage.setItem('history_v3', JSON.stringify(historyList))
    } else {
      editHistory()
    }

  }

  async function loadHistory() {
    const historyStorage = await AsyncStorage.getItem('history_v3');
    const historyList: History[] = historyStorage ? JSON.parse(historyStorage) : [];
    setHistoryData(historyList);
  }
  
  const openHistoryModal = () => {
  loadHistory();
  setShowHistoryToggle(true);
  };

  function restoreHistory(item:History) {
    setHistoryId(item.id)
    setFullData(item.fullData)
    setProudct(item.proudct)
    setNumberProudect(item.numberProudcts)
    setPrice(item.price)
    setMoneyAmount(item.moneyAmount)
  }
  async function deleteAll() {
      await saveInHistory() 
      setHistoryId(null)
      setFullData([])
      setMoneyAmount(0)
      setNumberProudect(0)
      setPrice(0)
      setProudct('');
  }
  function historyNameToggle() {
    if (showEditHistoryNameModal === false) {
      setshowEditHistoryNameModal(true)
    } else setshowEditHistoryNameModal(false)  } 
  
  return (
    <SafeAreaView style={styles.container}>
      <Header
        p="lg"
        borderBottomWidth={1}
        borderBottomColor="gray200"
        alignment="center"
        prefix={
          <View>
            <MButton bg="#fff" onPress={showOnlyList}>
              <Icon name="add-circle-outline" fontFamily="MaterialIcons" color='#444' fontSize="2xl" />
            </MButton>
            <MButton bg="#fff" onPress={() => {
              openHistoryModal()
            }}>
              <Icon name="history" fontFamily="MaterialIcons" color='#444' fontSize="2xl" />
            </MButton>
          </View>
        }
        suffix={
          <View>
          <MButton bg="#fff" onPress={lang}>
            <Icon name="language" fontFamily="MaterialIcons" color='#444' fontSize="2xl" />
          </MButton>

          <MButton bg="#fff" onPress={historyNameToggle}>
              <Icon name="add" fontFamily="MaterialIcons" color='#444' fontSize="2xl" />
            </MButton>
          </View>
        }
      >
        {isArabic ? 'إدارة المنتجات' : 'Product Management'}
      </Header>

      <Modal  
        isVisible={showEditHistoryNameModal}
        swipeDirection={'down'}
        p={5}
        onBackdropPress={() => setshowEditHistoryNameModal(false)}
        onSwipeComplete={() => setshowEditHistoryNameModal(false)}>
          <View>
            <TextInput             
            value={historyName}
            placeholder={isArabic ? "اسم السجل" : "history Name"}
            onChangeText={setHistoryName}
            style={[styles.input, isArabic && styles.arabicInput]}>
            </TextInput>
          </View>
      </Modal>

      <Modal 
        isVisible={showHistoryToggle}
        swipeDirection={'down'}
        p={20}
        onBackdropPress={() => setShowHistoryToggle(false)}
        onSwipeComplete={() => setShowHistoryToggle(false)}
      >
        <View style={{ flex: 1,}}>
          <FlatList
          data={historyData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <TouchableOpacity onPress={ async () => { 
              await deleteAll()
              restoreHistory(item) 
              setShowHistoryToggle(false)
            }}>
              <View style={{ margin: 5, backgroundColor:"#eee", borderRadius: 5, padding: 5}} >
              <Text style={{ color:"#000"}}>history Name: {item.historyName}</Text>
              <Text style={{ color:"#000"}}>Amount: {item.moneyAmount}</Text>
              <Text style={{ color:"#000"}}>Date: {new Date(item.date).toLocaleString()}</Text>
              </View>
          </TouchableOpacity>
          )}
          />
          </View>
          <Button title="Close" onPress={() => setShowHistoryToggle(false)} />

      </Modal>

      <Modal
        isVisible={onlyList}
        h={350}
        swipeDirection={'down'}
        p={20}
        onBackdropPress={() => setOnlyList(false)}
        onSwipeComplete={() => setOnlyList(false)}
      >
        <Div flexDir='row' justifyContent='flex-end' mb={20}>
          <MButton
            bg="gray400"
            h={35}
            w={35}
            rounded="circle"
            onPress={() => {
              setOnlyList(false);
            }}
          >
            <Icon color="black900" name="close" />
          </MButton>
        </Div>
        
        <View>
        <Text style={{ color: '#000'}}>{isArabic ? 'المنتج' : 'Product'}</Text>
          <TextInput
            value={proudct}
            placeholder={isArabic ? "المنتج" : "Product"}
            onChangeText={setProudct}
            style={[styles.input, isArabic && styles.arabicInput]}
          />
          <Text style={{ color: '#000'}}>{isArabic ? 'عدد المنتجات' : 'Number Of Products'}</Text>
          <TextInput
            value={numberProudcts.toString()}
            onChangeText={(text) => setNumberProudect(Number(text))}

            placeholder={isArabic ? "عدد المنتجات" : "Number of Products"}
            keyboardType="numeric"
            style={[styles.input, isArabic && styles.arabicInput]}
          />
          <Text style={{ color: '#000'}}>{isArabic ? 'السعر' : 'Price'}</Text>

          <TextInput
            value={price.toString()}
            placeholder={isArabic ? "السعر" : "Price"}
            keyboardType="numeric"
            onChangeText={(text) => setPrice(Number(text))}
            style={[styles.input, isArabic && styles.arabicInput]}
          />

          <MButton block={true} onPress={fullDataEnter} mt={20}>{isArabic ? 'إضافة منتج' : 'Add Product'}</MButton>
        </View>
      </Modal>

      <FlatList
        data={fullData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.card}>
          <MButton
            onPress={() => toggleEdit(index)}
            style={{
              backgroundColor: '#3282ce',
              borderColor: '#3282ce',
              padding: 0,
              margin: 0,
              width:22,
              height:22,
              borderRadius: 60
            }}
          >
            <Icon
              name="edit"
              fontFamily="FontAwesome"
              color={tag === index ? '#333' : '#fff'}  
              fontSize="4xl"  
            />
          </MButton>
            <Div flex={1} style={[styles.centeredContainer ]}>
              <Text style={styles.productName}>{item.proudct}</Text>
              <Text style={styles.productDetails}>{item.price} SR x {item.numberProudcts} = {item.multi} SR </Text>

              {tag === index && (
                <View>
                  <Div ><View><Text style={{ color: '#000'}}>  {isArabic?"عدد المنتجات المشترية" : "Number Of Proudcts"}</Text></View></Div>
                  <Div flexDir='row' p={10} >
                    <TouchableOpacity onPress={() => incrementProductQuantity(index)} style={styles.incrementButton}>
                      <Text style={styles.incrementButtonText}>{isArabic ? '+1' : '+1'}</Text>
                    </TouchableOpacity>
                    <TextInput
                      value={item.numberProudcts.toString()}
                      placeholder={isArabic ? "عدد المنتجات" : "Number of Products"}
                      keyboardType="numeric"
                      onChangeText={(text) => handleProductNumberChange(index, text)}
                      style={[styles.input,{flex:1}, isArabic && styles.arabicInput, styles.proInput]}
                    />
                    <TouchableOpacity onPress={() => subtractedProductQuantity(index)} style={styles.incrementButton}>
                      <Text style={styles.incrementButtonText}>{isArabic ? '-1' : '-1'}</Text>
                    </TouchableOpacity>
                  </Div>
                  <View><Text style={{ color: '#000'}}> {isArabic?"السعر" : "Price"}</Text></View>
                  <TextInput
                    value={item.price.toString()}
                    placeholder={isArabic ? "السعر" : "Price"}
                    keyboardType="numeric"
                    onChangeText={(text) => handlePriceChange(index, text)}
                    style={[styles.input, isArabic && styles.arabicInput] }
                  />
                  
                  <TouchableOpacity onPress={() => deleteCard(index)} style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>{isArabic ? 'حذف' : 'Delete'}</Text>
                  </TouchableOpacity>
                  
                </View>
              )}
            </Div>
          </View>
        )}
      />

      <Div p={20} bg='#fff' shadow={'md'} >
        <Text style={{ color: '#000'}}>{isArabic ? 'المال الذي حصلت عليه' : 'Money You Got'}</Text>
        <TextInput
          value={moneyAmount.toString()}
          placeholder={isArabic ? "المال الذي حصلت عليه" : "Money You Got"}
          keyboardType="numeric"
          onChangeText={handleMoneyAmountChange}
          style={[styles.input, isArabic && styles.arabicInput]}
        />
        <Div flexDir='row' style={{ gap: 10 }}>
          <Div bg='#eee' rounded={10} flexDir='column' alignItems='center' flex={1} p={10}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>{isArabic ? "مجموع الدفع" : "total"}</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>$ {totalSum}</Text>
          </Div>
          <Div bg='#eee' rounded={10} flexDir='column' alignItems='center' flex={1} p={10}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>{isArabic ? "المتبقي" : "left"}</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>$ {remainingMoney}</Text>
          </Div>
        </Div>
        <TouchableOpacity onPress={() => {
          Alert.alert( isArabic? "تحذير": "WARNING", isArabic? "سيتم حفظ جميع البيانات المدخلة في السجل  ": "all the info will be saved in the history",
            [
              {
                text: isArabic? "أحذف" : "Delete" ,
                onPress: async () => { deleteAll() }
              },
              {
                text: isArabic? "غير متأكد" : "Not sure",
                onPress: () => console.log( isArabic? "تمام" : "sure")
              }
            ]
          );
          }} style={styles.subtractButton}>
          <Text style={styles.subtractButtonText}>{isArabic ? 'حذف لكل البيانات' : 'Delete all'}</Text>
        </TouchableOpacity>
      </Div>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    direction: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    color: "#000"
  },
  arabicInput: {
    textAlign: 'right', 
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 17,
    marginVertical: 8,
    marginHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 1, height: 1 },
  },
  editButton: {
    position: 'absolute',
    top: 10,
    [I18nManager.isRTL ? 'left' : 'right']: 10,
    backgroundColor: '#ffc107',
    padding: 15,
    borderRadius: 5,
  },
  fullcard: {
    justifyContent: "center"
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  incrementButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  incrementButtonText: {
    color: '#fff',
    fontSize: 14,
    
  },
  multiplyButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  multiplyButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  productName: {
    color: "#000",
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productDetails: {
    color: "#000",
    fontSize: 16,
    padding:10,
  },
  sumButton: {
    backgroundColor: '#17a2b8',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  sumButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  totalSumText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  subtractButton: {
    backgroundColor: '#7A2020',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  subtractButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  remainingMoneyText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  centeredContainer: {
    flex: 1,
  },
  proInput:{
    margin:5,
    marginTop:10
  }
});

export default App;
