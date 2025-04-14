import { useThemePalette } from "@/hooks/useThemePalette";
import { hexToRgba } from "@/utils/colors";
import { useNetInfo } from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import {
    Animated,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { ThemedText } from "../ThemedText";

export default function NetworkModeStatus() {
  const { isInternetReachable } = useNetInfo();
  const palette = useThemePalette();
  const rippleSuccessColor = hexToRgba(palette.success, 0.3);
  const rippleErrorColor = hexToRgba(palette.error, 0.3);
  const backgroundSuccessColor = hexToRgba(palette.success, 0.1);
  const backgroundErrorColor = hexToRgba(palette.error, 0.1);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const fadeAnimation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Only display status if app starts offline
    if (isInternetReachable === false) {
      setIsVisible(true);
      fadeAnimation.setValue(1);
    } else {
      setIsVisible(false);
    }
  }, [isInternetReachable]);

  useEffect(() => {
    if (isInternetReachable === false) {
      setIsVisible(true);
      fadeAnimation.setValue(1);
    } else if (isInternetReachable && isVisible) {
      setIsVisible(true);
      Animated.sequence([
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setIsVisible(false));
    }
  }, [isInternetReachable]);

  return (
    <View>
      {/* Network Mode Description Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <ThemedText type="l" weight="medium" style={styles.modalTitle}>
              ما معنى وضع عدم الاتصال؟
            </ThemedText>

            <ScrollView>
              <View style={styles.modalBody}>
                <ThemedText type="l" style={styles.modalBodyText}>
                  في وضع عدم الاتصال، تواجه بعض القيود الهامة التي تؤثر على
                  تجربتك في استخدام التطبيق. بعض الخصائص قد لا تكون متاحة أو قد
                  لا تعمل بالشكل المتوقع كما هو الحال في وضع الاتصال بالإنترنت.
                </ThemedText>

                <ThemedText
                  type="md"
                  weight="medium"
                  style={styles.modalSubtitle}
                >
                  • عدم تحديث البيانات:
                </ThemedText>
                <ThemedText type="md" style={styles.modalBodyText}>
                  لن تتمكن من رؤية أحدث المعلومات. البيانات المعروضة هي نسخة
                  محفوظة من آخر استخدام لك للتطبيق في وضع الاتصال بالإنترنت. هذا
                  يعني أن أي تغييرات أو تحديثات جديدة لن تكون مرئية.
                </ThemedText>

                <ThemedText
                  type="md"
                  weight="medium"
                  style={styles.modalSubtitle}
                >
                  • قيود في البحث:
                </ThemedText>
                <ThemedText type="md" style={styles.modalBodyText}>
                  قد تعمل وظيفة البحث بشكل محدود في بعض الأقسام، مثل البحث عن
                  العملات الذي قد يعتمد على بيانات محفوظة. ومع ذلك، فإن البحث في
                  أقسام أخرى مثل المعاملات أو الوكلاء سيكون محدودًا جدًا أو غير
                  متاح، حيث سيعتمد فقط على البيانات المخزنة مسبقًا.
                </ThemedText>

                <ThemedText
                  type="md"
                  weight="medium"
                  style={styles.modalSubtitle}
                >
                  • تأجيل عمليات الإضافة مع خطر الفشل:
                </ThemedText>
                <ThemedText type="md" style={styles.modalBodyText}>
                  أي عمليات إضافة تقوم بها مثل إنشاء معاملة جديدة، أو وكيل جديد،
                  أو تقرير جديد، سيتم حفظها مؤقتًا في قائمة انتظار. سيحاول
                  التطبيق تنفيذ هذه العمليات تلقائيًا عند عودتك إلى وضع الاتصال
                  بالإنترنت.{" "}
                  <ThemedText weight="bold">
                    ومع ذلك، يجب الانتباه إلى أن أي أخطاء تحدث أثناء محاولة
                    الإنشاء سيتم تجاهلها في وضع عدم الاتصال. هذا يعني أن هناك
                    احتمالًا كبيرًا بأن تفشل بعض عمليات الإنشاء عند الاتصال
                    بالإنترنت دون علمك المباشر.
                  </ThemedText>
                </ThemedText>

                <ThemedText
                  type="md"
                  weight="medium"
                  style={styles.modalSubtitle}
                >
                  • تأجيل عمليات التحديث مع عدم ضمان النجاح:
                </ThemedText>
                <ThemedText type="md" style={styles.modalBodyText}>
                  سيتم حفظ عمليات التحديث التي تجريها مؤقتًا ومحاولة تنفيذها عند
                  الاتصال بالإنترنت.{" "}
                  <ThemedText weight="bold">
                    ومع ذلك، لا يوجد ضمان بأن تنجح جميع عمليات التحديث، وقد تفشل
                    بعضها بسبب تعارضات في البيانات أو مشاكل أخرى تحدث أثناء
                    الاتصال.
                  </ThemedText>
                </ThemedText>

                <ThemedText
                  type="md"
                  weight="medium"
                  style={styles.modalSubtitle}
                >
                  قيود محتملة أخرى في وضع عدم الاتصال:
                </ThemedText>
                <ThemedText type="md" style={styles.modalBodyText}>
                  • عدم إمكانية الوصول إلى الميزات التي تتطلب اتصالًا مباشرًا
                  بالخادم: بعض الميزات قد تعتمد بشكل أساسي على الاتصال بخوادم
                  التطبيق ولا يمكن استخدامها إطلاقًا في وضع عدم الاتصال. مثال
                  على ذلك قد يكون:
                                  </ThemedText>
<ThemedText type="sm" style={styles.modalListItem}>
                    - تسجيل الدخول أو تسجيل الخروج
                  </ThemedText>
                  <ThemedText type="sm" style={styles.modalListItem}>
                    - المصادقة أو التحقق من الهوية
                  </ThemedText>
                  <ThemedText type="sm" style={styles.modalListItem}>
                    - تلقي الإشعارات الفورية
                  </ThemedText>
                  <ThemedText type="sm" style={styles.modalListItem}>
                    - استخدام خدمات الموقع
                  </ThemedText>
                  <ThemedText type="sm" style={styles.modalListItem}>
                    - مشاركة البيانات أو تصديرها عبر الإنترنت
                  </ThemedText>
                  <ThemedText type="sm" style={styles.modalListItem}>
                    - تغيير إعدادات التطبيق التي تتطلب اتصالًا
                  </ThemedText>


                <ThemedText type="md" style={styles.modalBodyText}>
                  نوصي بالاتصال بالإنترنت بشكل دوري لضمان حصولك على أحدث
                  البيانات والاستفادة الكاملة من جميع ميزات التطبيق وتجنب فقدان
                  أي عمليات قمت بها في وضع عدم الاتصال.
                </ThemedText>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalOption, styles.cancelOption]}
              onPress={() => setIsModalVisible(false)}
            >
              <ThemedText style={styles.cancelText}>إلغاء</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Network Mode status button */}
      {isVisible && (
        <Animated.View style={{ opacity: fadeAnimation }}>
          <Pressable
            android_ripple={{
              color: isInternetReachable
                ? rippleSuccessColor
                : rippleErrorColor,
            }}
            onPress={() => {
              if (!isInternetReachable) {
                setIsModalVisible(true);
              }
            }}
          >
            <ThemedText
              style={{
                textAlign: "center",
                paddingVertical: 5,
                backgroundColor: isInternetReachable
                  ? backgroundSuccessColor
                  : backgroundErrorColor,
                color: isInternetReachable ? palette.success : palette.error,
              }}
            >
              {isInternetReachable
                ? "متّصل بشبكة الأنترنات"
                : "لست متّصل بشبكة الأنترنات"}
            </ThemedText>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
    maxHeight: '70%'
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
  },
  modalOption: {
    width: "100%",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  cancelOption: {
    borderBottomWidth: 0,
  },
  cancelText: {
    color: "red",
  },
  modalBody: {
    paddingVertical: 10,
  },
  modalSubtitle: {
    marginTop: 10,
    marginBottom: 5,
  },
  modalBodyText: {
    marginBottom: 8,
    lineHeight: 22,
  },
  modalListItem: {
    marginLeft: 15, // To indent the list items
    marginBottom: 3,
    lineHeight: 20,
  },
});
