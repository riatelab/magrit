# -*- coding: utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.by import By
#from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import NoAlertPresentException

from psutil import Popen
from flaky import flaky
from functools import wraps
#from io import BytesIO
from scipy.misc import imread
from scipy.linalg import norm
from scipy import average
from uuid import uuid4
import pytest
import unittest
import time
#import requests
import os
try:
    import ujson as json
except ImportError:
    import json

p = None


def setUpModule():
    start_magrit()


def tearDownModule():
    close_magrit()


def start_magrit():
    global p
    p = Popen(['./magrit_app/app.py'])
    time.sleep(1)


def close_magrit():
    for child in p.children(recursive=True):
        try:
            child.kill()
        except:
            pass
    p.kill()
    p.wait()


def retry(ExceptionToCheck, tries=4, delay=2):
    """
    Retry calling a decorated function

    Credits :
      http://www.saltycrane.com/blog/2009/11/trying-out-retry-decorator-python/
      original from: http://wiki.python.org/moin/PythonDecoratorLibrary#Retry
    """
    def deco_retry(f):
        @wraps(f)
        def f_retry(*args, **kwargs):
            mtries, mdelay = tries, delay
            while mtries > 1:
                try:
                    return f(*args, **kwargs)
                except ExceptionToCheck:
                    time.sleep(mdelay)
                    mtries -= 1
            return f(*args, **kwargs)
        return f_retry  # true decorator
    return deco_retry


def is_same_image(image1, image2):
    img1 = imread(image1).astype(float)
    img2 = imread(image2).astype(float)
    if img1.shape != img2.shape:
        return False
    img1 = normalize(to_grayscale(img1))
    img2 = normalize(to_grayscale(img2))
    z_norm = norm((img1 - img2).ravel(), 0)
    if z_norm < 1e-6:
        return True
    else:
        return False


def to_grayscale(arr):
    return average(arr, -1)


def normalize(arr):
    amin = arr.min()
    rng = arr.max() - amin
    return (arr - amin) * 255 / rng


def assertDeepAlmostEqual(test_case, expected, actual, name, places=1):
    """
    Assert that two complex structures have almost equal contents.

    Compares lists, dicts and tuples recursively. Checks numeric values
    using test_case's :py:meth:`unittest.TestCase.assertAlmostEqual` and
    checks all other values with :py:meth:`unittest.TestCase.assertEqual`.
    Accepts additional positional and keyword arguments and pass those
    intact to assertAlmostEqual() (that's how you specify comparison
    precision).

    :param test_case: TestCase object on which we can call all of the basic
    'assert' methods.
    :type test_case: :py:class:`unittest.TestCase` object
    """
    try:
        if isinstance(expected, (int, float, complex)):
            test_case.assertAlmostEqual(expected, actual, places=places)
        elif isinstance(expected, (list, tuple)):
            test_case.assertEqual(len(expected), len(actual))
            for index in range(len(expected)):
                v1, v2 = expected[index], actual[index]
                assertDeepAlmostEqual(test_case, v1, v2, name, places)
        elif isinstance(expected, dict):
            test_case.assertEqual(set(expected), set(actual))
            for key in expected:
                assertDeepAlmostEqual(
                    test_case, expected[key], actual[key], name, places)
        else:
            test_case.assertEqual(expected, actual)
    except AssertionError as exc:
        test_case.fail("{}: {}".format(name, exc))


class TestBase(unittest.TestCase):
    def make_context_click(self, target):
        action = webdriver.ActionChains(self.driver)
        action.context_click(target).perform()

    def make_double_click(self, target):
        action = webdriver.ActionChains(self.driver)
        action.double_click(target).perform()

    def validTypefield(self):
        self.click_elem_retry(
            self.driver.find_element_by_id(
                "box_type_fields").find_elements_by_css_selector(
                ".btn_ok")[0])
        time.sleep(0.5)

    def changeTypefield(self):
        pass

    def deeper_test_legend(self, id_legend, type_elem):
        legend_root = self.driver.find_element_by_id(id_legend)
        inner_groups = legend_root.find_elements_by_css_selector(".lg")
        self.assertIsInstance(inner_groups, list)
        self.assertGreater(len(inner_groups), 0)
        # Todo : check that right click and dblclick are working too

    def open_menu_section(self, nb_section):
        b = self.driver.find_element_by_id("btn_s{}".format(nb_section))
        if b:
            self.click_elem_retry(b)
            time.sleep(0.3)
        else:
            self.fail("Failed to open menu ", nb_section)

    def clickWaitTransition(self, css_selector, delay=0.4):
        self.driver.find_element_by_css_selector(css_selector).click()
        time.sleep(delay)

    @retry(Exception, 3, 1)
    def click_element_with_retry(self, selector):
        self.driver.find_element_by_css_selector(selector).click()

    @retry(Exception, 3, 1)
    def click_elem_retry(self, elem):
        elem.click()

    def get_button_ok_displayed(self, selector="button.swal2-confirm.swal2-styled", delay=30):
        if not self.try_element_present(By.CSS_SELECTOR, selector, delay):
            self.fail("Time out")
        else:
            button_ok = self.driver.find_element_by_css_selector(selector)
            for i in range(delay):
                if not button_ok.is_displayed():
                    time.sleep(1)
                else:
                    return button_ok
            self.fail("Time out")

    def waitClickButtonSwal(self, selector="button.swal2-confirm.swal2-styled", delay=30):
        button_ok = self.get_button_ok_displayed(selector, delay)
        button_ok.click()
        time.sleep(0.55)

    def waitClickButtonTypeLayer(self,
                                 selector='button.swal2-confirm.swal2-styled',
                                 type_layer='target',
                                 delay=30):
        button_ok = self.get_button_ok_displayed(selector, delay)
        Select(
            self.driver.find_element_by_css_selector('.swal2-select')
            ).select_by_value(type_layer)
        button_ok.click()
        time.sleep(0.5)

    def is_element_present(self, how, what):
        try:
            self.driver.find_element(by=how, value=what)
        except NoSuchElementException as e:
            return False
        return True

    def is_alert_present(self):
        try:
            self.driver.switch_to_alert()
        except NoAlertPresentException as e:
            return False
        return True

    def try_element_present(self, how, what, delay=60):
        for i in range(delay):
            try:
                if self.is_element_present(how, what):
                    return True
            except:
                pass
            time.sleep(1)
        return False

    def wait_until_overlay_disapear(self, delay=10):
        time.sleep(1)
        for i in range(delay):
            try:
                if self.driver.find_element_by_id(
                        'overlay').value_of_css_property('display') == 'none':
                    return True
            except:
                continue
            time.sleep(1)
        return False

    def close_alert_and_get_its_text(self):
        try:
            alert = self.driver.switch_to_alert()
            alert_text = alert.text
            if self.accept_next_alert:
                alert.accept()
            else:
                alert.dismiss()
            return alert_text
        finally:
            self.accept_next_alert = True


@flaky
class ProjectRoundTrip(TestBase):
    def setUp(self):
        self.tmp_folder = '/tmp/export_selenium_test_{}/'.format(
            str(uuid4()).split('-')[4])
        os.mkdir(self.tmp_folder)
        chromeOptions = webdriver.ChromeOptions()
#        chromeOptions.add_argument('headless')
#        chromeOptions.add_argument('window-size=1800x800')
        chromeOptions.add_experimental_option(
            "prefs", {"download.default_directory": self.tmp_folder})
        self.driver = webdriver.Chrome(options=chromeOptions)

        self.driver.set_window_size(1600, 900)
        self.driver.implicitly_wait(2)
        self.base_url = "http://localhost:9999/modules"
        self.verificationErrors = []
        self.accept_next_alert = True

    def test_map_and_layout_features(self):
        driver = self.driver
        driver.get(self.base_url)

        # Load a sample layer:
        self.clickWaitTransition("#sample_link")
        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("martinique")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonTypeLayer()
        self.waitClickButtonSwal()
        self.validTypefield()

        # Change the projection:
        Select(
            driver.find_element_by_id("form_projection2")
            ).select_by_value("HEALPix")

        # Open the menu to choose a representation:
        self.open_menu_section(2)

        # Choropleth representation :
        self.clickWaitTransition("#button_choro")
        Select(
            driver.find_element_by_id("choro_field1")
            ).select_by_visible_text("Part_Logements_Vacants")
        driver.find_element_by_css_selector(
            "option[value=\"Part_Logements_Vacants\"]").click()
        driver.find_element_by_id("ico_jenks").click()

        output_name = driver.find_element_by_id('Choro_output_name')
        output_name.clear()
        output_name.send_keys('choro_martinique')
        driver.find_element_by_id("choro_yes").click()
        time.sleep(1)  # Little delay for the map to be rendered

        self.open_menu_section(4)
        # Now add some layout features:
        # A title:
        new_title = 'The new title!'
        input_title = driver.find_element_by_id('title')
        input_title.clear()
        input_title.send_keys(new_title)

        # The sphere background :
        driver.find_element_by_id('btn_sphere').click()
        time.sleep(0.2)

        # A scale bar :
        driver.find_element_by_id('btn_scale').click()
        time.sleep(0.2)
        driver.find_element_by_id("svg_map").click()
        time.sleep(0.2)

        # A north arrow :
        driver.find_element_by_id('btn_north').click()
        time.sleep(0.2)
        driver.find_element_by_id("svg_map").click()
        time.sleep(0.2)

        driver.find_element_by_id('save_file_button').click()
        time.sleep(2)
        # Export the project file corresponding to the current state :
        with open(self.tmp_folder + 'magrit_project.json') as f:
            data_1 = json.loads(f.read())

        os.remove(self.tmp_folder + 'magrit_project.json')

        # Reload the page :
        driver.get(self.base_url)
        time.sleep(0.2)
        # Close the alert asking confirmation for closing the page
        # (this is when the last state of the current project is saved)
        driver.switch_to.alert.accept()

        # Click on the button to reload the last project :
        self.waitClickButtonSwal("button.swal2-cancel")
        time.sleep(1)

        # The previous map should now be reloaded
        # Let's export the project file and
        # compare it with the previous version
        time.sleep(0.5)
        driver.find_element_by_id('save_file_button').click()
        time.sleep(2)
        # Export the project file corresponding to the current state :
        with open(self.tmp_folder + 'magrit_project.json') as f:
            data_2 = json.loads(f.read())

        del data_1['info']['version']
        del data_2['info']['version']
        # Are the two projects the same ?
        assertDeepAlmostEqual(self, data_1, data_2, "Simple Map 1")

    def test_simple_map(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")
        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts2_data")
        driver.find_element_by_css_selector(".btn_ok").click()

        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        # Render a gridded map:
        self.open_menu_section(2)
        self.clickWaitTransition("#button_grid")

        Select(
            driver.find_element_by_id("Gridded_field")
            ).select_by_visible_text("POP")
        driver.find_element_by_id("Gridded_cellsize").clear()
        driver.find_element_by_id("Gridded_cellsize").send_keys("275")
        Select(
            driver.find_element_by_id("Gridded_shape")
            ).select_by_value("Diamond")
        driver.find_element_by_id("Gridded_yes").click()

        self.waitClickButtonSwal()
        time.sleep(0.5)
        driver.find_element_by_id('save_file_button').click()
        time.sleep(2)
        # Export the project file corresponding to the current state :
        with open(self.tmp_folder + 'magrit_project.json') as f:
            data_1 = json.loads(f.read())

        os.remove(self.tmp_folder + 'magrit_project.json')

        # Reload the page :
        driver.get(self.base_url)
        time.sleep(0.2)
        # Close the alert asking confirmation for closing the page
        # (this is when the last state of the current project is saved)
        driver.switch_to.alert.accept()

        # Click on the button to reload the last project :
        self.waitClickButtonSwal("button.swal2-cancel")
        time.sleep(1)

        # The previous map should now be reloaded
        # Let's export the project file and compare it with
        # the previous version
        time.sleep(0.5)
        driver.find_element_by_id('save_file_button').click()
        time.sleep(2)
        # Export the project file corresponding to the current state :
        with open(self.tmp_folder + 'magrit_project.json') as f:
            data_2 = json.loads(f.read())

        # Are the two projects the same ?
        assertDeepAlmostEqual(self, data_1, data_2, "Simple Map 1")

    def tearDown(self):
        self.assertEqual([], self.verificationErrors)
        files = os.listdir(self.tmp_folder)
        [os.remove(self.tmp_folder + file) for file in files]
        os.removedirs(self.tmp_folder)
        self.driver.quit()


#class ReloadCompareProjectsTest(TestBase):
#    def setUp(self):
#        self.tmp_folder = '/tmp/export_selenium_test_{}/'.format(
#            str(uuid4()).split('-')[4])
#        os.mkdir(self.tmp_folder)
#        chromeOptions = webdriver.ChromeOptions()
##        chromeOptions.add_argument('headless')
##        chromeOptions.add_argument('window-size=1800x800')
#        chromeOptions.add_experimental_option(
#            "prefs", {"download.default_directory": self.tmp_folder})
#        self.driver = webdriver.Chrome(executable_path='/home/mz/chromedriver',
#                                       options=chromeOptions)
#
#        self.driver.set_window_size(1600, 900)
#        self.driver.implicitly_wait(2)
#        self.base_url = "http://localhost:9999/modules"
#        self.verificationErrors = []
#        self.accept_next_alert = True
#        self.fetch_projets_github()
#
#    def t_reload(self, i, name):
#        url, b_image, project = \
#            self.urls[name], self.images[name], json.loads(self.projects[name])
#        with self.subTest(i=i):
#            driver = self.driver
#            driver.get(self.base_url + "?reload={}".format(url))
#            time.sleep(0.3)
#            if i > 0:
#                driver.switch_to.alert.accept()
#            if not self.wait_until_overlay_disapear(5):
#                self.fail("Overlay not hiding / Project reloading")
#
#            self.open_menu_section(5)
#            time.sleep(0.4)
#            Select(driver.find_element_by_id(
#                "select_export_type")).select_by_value("png")
#            time.sleep(0.2)
#            input_name = driver.find_element_by_css_selector(
#                'input#export_filename')
#            input_name.clear()
#            input_name.send_keys('{}.png'.format(name))
#            driver.find_element_by_id("export_button_section5b").click()
#            time.sleep(2.5)
#            if not is_same_image(
#                    '{}{}.png'.format(self.tmp_folder, name), b_image):
#                self.fail("Image {} differs from original".format(name))
#            os.remove('{}{}.png'.format(self.tmp_folder, name))
#            driver.find_element_by_id('save_file_button').click()
#            time.sleep(2.5)
#            with open(self.tmp_folder + 'magrit_project.json') as f:
#                data = json.loads(f.read())
#            del data['info']['version']
#            del project['info']['version']
#            assertDeepAlmostEqual(self, data, project, name)
#            os.remove(self.tmp_folder + 'magrit_project.json')
#
#    def test_each_project(self):
#        names = list(self.urls.keys())
#        for i, name in enumerate(names):
#            if name == "grid_usa": continue
#            self.t_reload(i, name)
#
#    def tearDown(self):
#        self.assertEqual([], self.verificationErrors)
#        files = os.listdir(self.tmp_folder)
#        [os.remove(self.tmp_folder + file) for file in files]
#        os.removedirs(self.tmp_folder)
#        self.driver.quit()
#
#    def fetch_projets_github(self):
#        r = requests.get('https://api.github.com/repos/mthh/example-magrit-projects/contents/')
#        data = json.loads(r.text)
#        self.urls = {}
#        self.images = {}
#        self.projects = {}
#        for d in data:
#            name = d['name']
#            if 'json' in name:
#                self.urls[name.replace('.json', '')] = d['download_url']
#                resp_project = requests.get(d['download_url'])
#                self.projects[name.replace('.json', '')] = resp_project.text
#            elif 'png' in name:
#                resp_image = requests.get(d['download_url'])
#                self.images[name.replace('.png', '')] = \
#                    BytesIO(resp_image.content)


@flaky
class MainFunctionnalitiesTest(TestBase):
    """
    Runs a test using travis-ci and saucelabs
    """

    def setUp(self):
        self.tmp_folder = "/tmp/export_selenium_test_{}/".format(
            str(uuid4()).split('-')[4])
        os.mkdir(self.tmp_folder)
        chromeOptions = webdriver.ChromeOptions()
#        chromeOptions.add_argument('headless')
#        chromeOptions.add_argument('window-size=1800x800')
        chromeOptions.add_experimental_option(
            "prefs", {"download.default_directory": self.tmp_folder})
        self.driver = webdriver.Chrome(options=chromeOptions)

        # profile = webdriver.FirefoxProfile()
        # profile.set_preference("browser.download.folderList", 2)
        # profile.set_preference("browser.download.manager.showWhenStarting", False)
        # profile.set_preference("browser.download.dir", self.tmp_folder)
        # profile.set_preference("browser.helperApps.neverAsk.saveToDisk", "image/png,image/svg+xml,application/octet-stream,application/json")
        # self.driver = webdriver.Firefox(executable_path="/home/mz/geckodriver", firefox_profile=profile)

        self.driver.set_window_size(1600, 900)
        self.driver.implicitly_wait(2)
        self.base_url = "http://localhost:9999/modules"
        self.verificationErrors = []
        self.accept_next_alert = True

    def tearDown(self):
        self.assertEqual([], self.verificationErrors)
        files = os.listdir(self.tmp_folder)
        [os.remove(self.tmp_folder + file) for file in files]
        os.removedirs(self.tmp_folder)
        self.driver.quit()

    # Not yet sure why but it seems to always fail when runned on Travis:
    @pytest.mark.xfail(strict=False)
    def test_languages(self):
        menu_desc = {
            "fr": ["Import des données", "Choix de la représentation"],
            "en": ["Add your data", "Choose a representation"],
            }
        driver = self.driver
        driver.get(self.base_url)
        button_lang = driver.find_element_by_css_selector("#current_app_lang")
        current_lang = button_lang.text
        menu1 = driver.find_element_by_css_selector("#btn_s1")
        menu2 = driver.find_element_by_css_selector("#btn_s2")
        self.assertEqual(menu1.text, menu_desc[current_lang][0])
        self.assertEqual(menu2.text, menu_desc[current_lang][1])

        button_lang.click()
        driver.find_element_by_css_selector(
            "#menu_lang"
            ).find_element_by_xpath("//li[@data-index='1']").click()
        new_lang = driver.find_element_by_css_selector(
            "#current_app_lang").text
        self.assertNotEqual(current_lang, new_lang)

        menu1 = driver.find_element_by_css_selector("#btn_s1")
        menu2 = driver.find_element_by_css_selector("#btn_s2")
        self.assertEqual(menu1.text, menu_desc[new_lang][0])
        self.assertEqual(menu2.text, menu_desc[new_lang][1])

    # Not yet sure why but it seems to always fail when runned on Travis:
    @pytest.mark.xfail(strict=False)
    def test_extra_basemaps(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition('#sample_link')
        driver.find_element_by_css_selector("#panel1 > p > span").click()
        time.sleep(0.2)
        # Select an extra basemap :
        Select(
            driver.find_element_by_css_selector('#panel2 > p > select')
            ).select_by_visible_text('Canada')
        driver.find_element_by_css_selector(".btn_ok").click()

        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()
        time.sleep(0.5)

        self._verif_export_result('Canada')

    def test_layout_features(self):
        driver = self.driver
        driver.get(self.base_url)
        self.open_menu_section(4)

        # Test the title :
        new_title = 'The new title!'
        input_title = driver.find_element_by_id('title')
        input_title.clear()
        input_title.send_keys(new_title)
        title_svg = driver.find_element_by_css_selector(
            'g#map_title > text').text
        self.assertEqual(new_title, title_svg)

        # Test the graticule :
        driver.find_element_by_id('btn_graticule').click()
        time.sleep(0.2)
        if not self.try_element_present(By.ID, "L_Graticule"):
            self.fail("Graticule won't display")
        if not self.try_element_present(By.CSS_SELECTOR, "li.L_Graticule"):
            self.fail("Graticule won't appeat in layer manager")

        # Test the sphere element :
        driver.find_element_by_id('btn_sphere').click()
        time.sleep(0.2)
        if not self.try_element_present(By.ID, "L_Sphere"):
            self.fail("Sphere background won't display")
        if not self.try_element_present(By.CSS_SELECTOR, "li.L_Sphere"):
            self.fail("Sphere won't appeat in layer manager")

        # Test the text annotation and feed it with some text :
        driver.find_element_by_id('btn_text_annot').click()
        time.sleep(0.2)
        driver.find_element_by_id("svg_map").click()
        time.sleep(1)
        textarea_input = driver.find_element_by_id('annotation_content')
        time.sleep(0.25)
        textarea_input.clear()
        textarea_input.send_keys('Mon annotation de texte')
        driver.find_element_by_css_selector('.btn_ok').click()
        time.sleep(0.5)
        text_annot = driver.find_element_by_id('in_text_annotation_0')
        self.assertEqual(text_annot.is_displayed(), True)
        self.assertEqual(text_annot.text, 'Mon annotation de texte')
        self._verif_context_menu(text_annot, "text annotation")

        # Test the scale bar :
        driver.find_element_by_id('btn_scale').click()
        time.sleep(0.2)
        driver.find_element_by_id("svg_map").click()
        time.sleep(0.2)
        if not self.try_element_present(By.ID, "scale_bar"):
            self.fail("Scale bar won't display")
        self._verif_context_menu(
            driver.find_element_by_id("scale_bar"), "scale bar")
        self._verif_dbl_click_open_ctx_menu(
            driver.find_element_by_id("scale_bar"), "scale bar")

        # Test the north arrow :
        driver.find_element_by_id('btn_north').click()
        time.sleep(0.2)
        driver.find_element_by_id("svg_map").click()
        time.sleep(0.2)
        if not self.try_element_present(By.ID, "north_arrow"):
            self.fail("North arrow won't display")
        self._verif_context_menu(
            driver.find_element_by_id("north_arrow"), "north arrow")
        self._verif_dbl_click_open_ctx_menu(
            driver.find_element_by_id("north_arrow"), "north arrow")

        svg_map = driver.find_element_by_id("svg_map")

        # Test the arrow drawn by the user :
        driver.find_element_by_id('btn_arrow').click()
        time.sleep(0.2)
        driver.find_element_by_id("svg_map").click()
        time.sleep(0.1)
        # Move the cursor a bit in order to simulate the drawing of the arrow :
        ac = webdriver.ActionChains(driver)
        ac.move_to_element(svg_map).move_by_offset(10, 10).click().perform()
        driver.find_element_by_id("svg_map").click()
        time.sleep(1)
        if not self.try_element_present(By.ID, "arrow_0"):
            self.fail("User drawn arrow won't display")
        self._verif_context_menu(
            driver.find_element_by_id("arrow_0"), "user arrow")

        # Test the ellipse creation :
        driver.find_element_by_id('btn_ellipse').click()
        time.sleep(0.2)
        driver.find_element_by_id("svg_map").click()
        time.sleep(0.5)
        if not self.try_element_present(By.ID, "user_ellipse_0"):
            self.fail("Ellipse won't display")
        self._verif_context_menu(
            driver.find_element_by_id("user_ellipse_0"), "user ellipse")

#        # Test the rectangle creation :
#        driver.find_element_by_id('btn_rectangle').click()
#        time.sleep(0.2)
#        ac = webdriver.ActionChains(driver)
#        ac.click_and_hold(driver.find_element_by_id("svg_map")).perform()
#        ac.move_by_offset(20, 20).perform()
#        ac.click().perform()
#        time.sleep(0.5)
#        if not self.try_element_present(By.ID, "user_rectangle_0"):
#            self.fail("Rectangle won't display")
#        self._verif_context_menu(
#            driver.find_element_by_id("user_rectangle_0"), "user rectangle")

        # Test the map background color :
        driver.execute_script(
            """
            var bg_color_elem = document.getElementById('bg_color');
            bg_color_elem.value = '#da2929';
            bg_color_elem.dispatchEvent(new Event('change'));"""
            )

        svg_map = driver.find_element_by_id('svg_map')
        self.assertEqual(
            'rgba(218, 41, 41, 1)',
            svg_map.value_of_css_property('background-color'))

#    def test_links(self):
#        driver = self.driver
#        driver.get(self.base_url)
#        self.clickWaitTransition("#sample_link")
#
#        Select(driver.find_element_by_css_selector("select.sample_target")
#            ).select_by_value("world_countries_data")
#        driver.find_element_by_css_selector(".btn_ok").click()
#        self.waitClickButtonTypeLayer(type_layer='target')
#        self.waitClickButtonSwal()
#        # Valid the type of each field :
#        self.validTypefield()
#        time.sleep(1)
#        with open('tests/load_links.js') as f:
#            script = f.read()
#        driver.execute_script(script)
#        time.sleep(1)
#        self.waitClickButtonSwal("button.swal2-cancel.swal2-styled")
#
#        self.open_menu_section(2)
#        self.clickWaitTransition("#button_flow")
#
#        Select(driver.find_element_by_id("FlowMap_field_i")
#            ).select_by_visible_text("i")
#        Select(driver.find_element_by_id("FlowMap_field_j")
#            ).select_by_visible_text("j")
#        Select(driver.find_element_by_id("FlowMap_field_fij")
#            ).select_by_visible_text("fij")
#
#        Select(driver.find_element_by_id("FlowMap_field_join")
#            ).select_by_visible_text("ISO2")
#
#        driver.find_element_by_id('FlowMap_output_name').clear()
#        driver.find_element_by_id('FlowMap_output_name').send_keys('result_layer')
#
#        driver.find_element_by_id("FlowMap_yes").click()
#        self.waitClickButtonSwal()
#        if not self.try_element_present(By.ID, "legend_root_lines_class", 5):
#            self.fail("Legend not displayed on links map")
#        self._verif_legend_hide_show_button('result_layer')
#        self._verif_export_result('result_layer')

    def test_legends_layout_layer(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition('#sample_link')
        # Add a layout layer of points:
        Select(
            driver.find_element_by_css_selector('select.sample_target')
            ).select_by_value('world_capitals')
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonTypeLayer(type_layer='layout')
        self.waitClickButtonSwal()

        self.open_menu_section(3)
        # Open the box allowing to modify style properties:
        self.click_elem_retry(
            driver.find_element_by_css_selector(
                "li.L_world_cities > div > .style_target_layer"))
        time.sleep(0.4)
        # Create a legend:
        driver.find_element_by_id('checkbox_layout_legend').click()
        # Close the box:
        driver.find_element_by_css_selector(".btn_ok").click()

        # Is the legend displayed ?
        if not self.try_element_present(
                By.CSS_SELECTOR,
                '.lgdf_L_world_cities', 5):
            self.fail('Legend not displayed for layout layer of points')

        # Add a layout layer of polygons:
        self.open_menu_section(1)
        self.clickWaitTransition('#sample_link')
        Select(
            driver.find_element_by_css_selector('select.sample_target')
            ).select_by_value('world_country')
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonTypeLayer(type_layer='layout')
        self.waitClickButtonSwal()

        self.open_menu_section(3)
        # Open the box allowing to modify style properties:
        self.click_elem_retry(
            driver.find_element_by_css_selector(
                "li.L_world_country > div > .style_target_layer"))
        time.sleep(0.4)
        # Create a legend:
        driver.find_element_by_id('checkbox_layout_legend').click()
        # Close the box:
        driver.find_element_by_css_selector(".btn_ok").click()

        # Is the legend displayed ?
        if not self.try_element_present(
                By.CSS_SELECTOR,
                '.lgdf_L_world_country', 5):
            self.fail('Legend not displayed for layout layer of points')


    def test_f_Gridded(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")
        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts2_data")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(2)
        self.clickWaitTransition("#button_grid")

        input_grid_size = driver.find_element_by_id("Gridded_cellsize")
        output_name = driver.find_element_by_id('Gridded_output_name')
        for i, shape in enumerate(('Square', 'Diamond', 'Hexagon')):
            if i > 0:
                self.open_menu_section('2b')
            Select(
                driver.find_element_by_id("Gridded_field")
                ).select_by_visible_text("POP")
            input_grid_size.clear()
            input_grid_size.send_keys("220")
            Select(
                driver.find_element_by_id("Gridded_shape")
                ).select_by_value(shape)
            output_name.clear()
            output_name.send_keys('gridded_{}'.format(shape))
            driver.find_element_by_id("Gridded_yes").click()

            self.waitClickButtonSwal()

            if not self.try_element_present(
                    By.CSS_SELECTOR,
                    '.lgdf_L_gridded_{}'.format(shape), 5):
                self.fail("Legend not displayed on grid map")

    def test_generate_labels(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")
        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts2_data")
        driver.find_element_by_css_selector(".btn_ok").click()

        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(3)
        self.click_elem_retry(
            driver.find_element_by_css_selector(
                "li.L_nuts2-2013-data > div > .style_target_layer"))
        time.sleep(0.5)
        self.clickWaitTransition("#generate_labels")
        Select(
            driver.find_element_by_id("label_box_field")
            ).select_by_value("id")
        self.waitClickButtonSwal()
        time.sleep(1)
        self.click_element_with_retry(".btn_ok")
        time.sleep(0.5)
        labels = driver.find_element_by_id(
            "L_Labels_id_nuts2-2013-data"
            ).find_elements_by_css_selector("text")
        self.assertIsInstance(labels, list)
        self.assertGreater(len(labels), 0)

    def test_change_projection(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")
        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts2_data")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()
        # Valid the type of each field :
        self.validTypefield()

        # Open the section of the menu with the layer manager :
        self.open_menu_section(3)

        # Change the projection for an interrupted one :
        Select(
            driver.find_element_by_id("form_projection2")
            ).select_by_value("HEALPix")
        time.sleep(2)

        # Global value was updated :
        proj_name = driver.execute_script(
            'value = window._app.current_proj_name; return value;')
        self.assertEqual(proj_name, "HEALPix")
        # Layer have a clip-path (as this projection is interrupted) :
        clip_path_value = driver.execute_script('''
val = document.getElementById("L_nuts2-2013-data").getAttribute("clip-path");
return val;''')
        self.assertEqual("url(#clip)", clip_path_value)

        # Change for a non-interrupted projection :
        Select(
            driver.find_element_by_id("form_projection2")
            ).select_by_value("Robinson")
        time.sleep(2)

        # Global value was updated :
        proj_name = driver.execute_script(
            'value = window._app.current_proj_name; return value;')
        self.assertEqual(proj_name, "Robinson")
        # Layer don't have a clip-path anymore :
        clip_path_value = driver.execute_script('''
val = document.getElementById("L_nuts2-2013-data").getAttribute("clip-path");
return val;''')
        self.assertEqual(None, clip_path_value)

        # Test that after reprojecting, the map is still centered
        # on the targeted layer
        #
        # Fetch the current zoom value :
        zoom_val = driver.execute_script(
            '''val = svg_map.__zoom.toString(); return val;''')

        # Click on the "fit-zoom" button of the targeted layer :
        self.click_elem_retry(
            driver.find_element_by_css_selector(
                "li.L_nuts2-2013-data > div > #zoom_fit_button"))

        # Fetch again the current zoom value :
        zoom_val2 = driver.execute_script(
            '''val = svg_map.__zoom.toString(); return val;''')
        # Nothing should have change :
        self.assertEqual(zoom_val, zoom_val2)

        # TODO : adding a new layout layer
        #  then clicking on the "fit-zoom" button and fetch the new zoom value
        #    to verify that it changed:
#        self.click_elem_retry(
#            driver.find_element_by_css_selector(
#                "li.L_World > div > #eye_closed"))
#
#        self.click_elem_retry(
#            driver.find_element_by_css_selector(
#                "li.L_World > div > #zoom_fit_button"))
#        zoom_val3 = driver.execute_script(
#            '''val = svg_map.__zoom.toString(); return val;''');
#        # This time it should have changed :
#        self.assertNotEqual(zoom_val, zoom_val3)

        # Change for a projection commign from prj4 string:
        Select(
            driver.find_element_by_id("form_projection2")
            ).select_by_value("AzimuthalEqualAreaEurope")
        time.sleep(2)

        # Global value was updated:
        proj_name = driver.execute_script(
            'value = window._app.current_proj_name; return value;')
        self.assertEqual(proj_name, "def_proj4")
        # The proj.4 string value can be retrieved:
        proj_string = driver.execute_script(
            'return window._app.last_projection;')
        self.assertEqual(
            proj_string,
            '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 '
            '+ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs ')

    def test_change_projection_from_proj4_box(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition('#sample_link')
        Select(
            driver.find_element_by_css_selector('select.sample_target')
            ).select_by_value('martinique')
        driver.find_element_by_css_selector('.btn_ok').click()
        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()
        self.validTypefield()

        Select(
            driver.find_element_by_id('form_projection2')
            ).select_by_value('proj4')
        time.sleep(0.3)

        # Try to put a correct EPSG code:
        input_elem = driver.find_element_by_id('input_proj_string')
        input_elem.clear()
        input_elem.send_keys('EPSG:4326')

        # Confirm and close the box:
        driver.find_element_by_css_selector('.btn_ok').click()

        # Verify that the correct name is displayed:
        name = driver.find_element_by_css_selector(
            '#form_projection2 > option[value="last_projection"]').text
        self.assertEqual(name, 'WGS 84')

        # Verify we can retrieve the proj.4 string corresponding to
        # that EPSG code:
        proj_string = driver.execute_script('''
            return window._app.last_projection;''')

        self.assertEqual(proj_string, "+proj=longlat +datum=WGS84 +no_defs ")

        # Retry with a proj4 string this time:
        Select(
            driver.find_element_by_id('form_projection2')
            ).select_by_value('proj4')
        time.sleep(0.3)

        # Try to put a correct proj4 string:
        input_elem = driver.find_element_by_id('input_proj_string')
        input_elem.clear()
        input_elem.send_keys((
            '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 '
            '+y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs'))

        # Confirm and close the box:
        driver.find_element_by_css_selector('.btn_ok').click()

        # Verify that the correct name is displayed:
        name = driver.find_element_by_css_selector(
            '#form_projection2 > option[value="last_projection"]').text
        self.assertEqual(
            name, 'Popular Visualisation CRS / Mercator (deprecated)')

        # Verify we can retrieve the proj.4 string corresponding to
        # that EPSG code:
        proj_string = driver.execute_script('''
            return window._app.last_projection;''')

        self.assertEqual(proj_string, (
            '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 '
            '+y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs'))

        # Retry with a OGC WKT string this time:
        Select(
            driver.find_element_by_id('form_projection2')
            ).select_by_value('proj4')
        time.sleep(0.3)

        # Try to put a correct WKT definition:
        input_elem = driver.find_element_by_id('input_proj_string')
        input_elem.clear()
        input_elem.send_keys((
            'PROJCS["World Equidistant Cylindrical (Sphere)",'
            'GEOGCS["Unspecified datum based upon the GRS 1980 Authalic Sphere'
            '",DATUM["Not_specified_based_on_GRS_1980_Authalic_Sphere",'
            'SPHEROID["GRS 1980 Authalic Sphere",6371007,0,'
            'AUTHORITY["EPSG","7048"]],AUTHORITY["EPSG","6047"]],'
            'PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],'
            'UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],'
            'AUTHORITY["EPSG","4047"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]'
            '],PROJECTION["Equirectangular"],PARAMETER["latitude_of_origin",0]'
            ',PARAMETER["central_meridian",0],PARAMETER["false_easting",0],'
            'PARAMETER["false_northing",0],AUTHORITY["EPSG","3786"],'
            'AXIS["X",EAST],AXIS["Y",NORTH]]'))

        # Confirm and close the box:
        driver.find_element_by_css_selector('.btn_ok').click()

        # Verify that the name was changed compared to the previous projection:
        name = driver.find_element_by_css_selector(
            '#form_projection2 > option[value="last_projection"]').text
        self.assertNotEqual(
            name, 'Popular Visualisation CRS / Mercator (deprecated)')

        # Verify we can retrieve the WKT string:
        wkt_string = driver.execute_script('''
            return window._app.last_projection;''')

        self.assertIn('World Equidistant Cylindrical (Sphere)', wkt_string)

        # Retry with an invalid string this time:
        Select(
            driver.find_element_by_id('form_projection2')
            ).select_by_value('proj4')
        time.sleep(0.3)

        # Try to put a correct WKT definition:
        input_elem = driver.find_element_by_id('input_proj_string')
        input_elem.clear()
        input_elem.send_keys('bogus value')

        # Confirm and close the box:
        driver.find_element_by_css_selector('.btn_ok').click()

        # There is an error message:
        self.waitClickButtonSwal()

        # Verify the WKT string for the current projection didn't change
        # as the projection didn't changed:
        wkt_string2 = driver.execute_script('''
            return window._app.last_projection;''')
        self.assertEqual(wkt_string2, wkt_string)

    def test_change_projection_from_box(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")
        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts2_data")
        driver.find_element_by_css_selector(".btn_ok").click()
        #
        self.waitClickButtonTypeLayer(type_layer='target')

        self.waitClickButtonSwal()
        # Valid the type of each field :
        self.validTypefield()

        # Open the box allowing to choose more projections:
        Select(
            driver.find_element_by_id("form_projection2")
            ).select_by_value("more")
        time.sleep(0.4)

        # Select the Gall-Peters projection in the list:
        Select(
            driver.find_element_by_id('select_proj')
            ).select_by_value('GallPeters')

        driver.find_element_by_id('btn_valid_reproj').click()
        time.sleep(1)
        # Close the box:
        driver.find_element_by_css_selector('.btn_ok').click()

        # Global value was updated:
        proj_name = driver.execute_script(
            'value = window._app.current_proj_name; return value;')
        self.assertEqual(proj_name, "GallPeters")

    def test_reload_project_localStorage(self):
        driver = self.driver
        driver.get(self.base_url)
        # First render a grid layer :
        self.clickWaitTransition("#sample_link")
        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts2_data")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(2)
        self.clickWaitTransition("#button_grid")

        Select(
            driver.find_element_by_id("Gridded_field")
            ).select_by_visible_text("GDP")
        driver.find_element_by_id("Gridded_cellsize").clear()
        driver.find_element_by_id("Gridded_cellsize").send_keys("300")
        Select(
            driver.find_element_by_id("Gridded_shape")
            ).select_by_value("Square")
        driver.find_element_by_id("Gridded_yes").click()

        self.waitClickButtonSwal()

        self.assertEqual(
            True,
            self.try_element_present(By.ID, "legend_root", 5))
        self.open_menu_section(4)

        # Then add some layout features :
        driver.find_element_by_id('btn_scale').click()
        time.sleep(0.2)
        driver.find_element_by_id("svg_map").click()
        time.sleep(0.2)
        if not self.try_element_present(By.ID, "scale_bar"):
            self.fail("Scale bar won't display")

        driver.find_element_by_id('btn_graticule').click()
        time.sleep(0.2)
        if not self.try_element_present(By.ID, "L_Graticule"):
            self.fail("Graticule won't display")

        driver.find_element_by_id('btn_sphere').click()
        time.sleep(0.2)
        if not self.try_element_present(By.ID, "L_Sphere"):
            self.fail("Sphere background won't display")

#        driver.find_element_by_id('btn_rectangle').click()
#        time.sleep(0.2)
#        ac = webdriver.ActionChains(driver)
#        ac.click_and_hold(driver.find_element_by_id("svg_map")).perform()
#        ac.move_by_offset(20, 20).click().perform()
#        time.sleep(0.2)
#        if not self.try_element_present(By.ID, "user_rectangle_0"):
#            self.fail("Rectangle won't display")

        # Reload the page :
        driver.get(self.base_url)
        time.sleep(0.2)
        # Close the alert asking confirmation for closing the page
        # (this is when the last state of the current project is saved)
        driver.switch_to.alert.accept()

        # Click on the button to reload the last project :
        self.waitClickButtonSwal("button.swal2-cancel")
        time.sleep(1)

        # Assert the various element were reloaded :
        if not self.try_element_present(By.ID, "scale_bar"):
            self.fail("Scale bar not reloaded")

        if not self.try_element_present(By.ID, "L_Graticule"):
            self.fail("Graticule not reloaded")

        if not self.try_element_present(By.ID, "L_Sphere"):
            self.fail("Sphere background  not reloaded")

#        if not self.try_element_present(By.ID, "user_rectangle_0"):
#            self.fail("Rectangle not reloaded")

        # Assert our layers have been reloaded :
        layers = driver.execute_script('''
            return Object.keys(window.data_manager.current_layers);''')
        expected_layers = {
            'Sphere',
            'Graticule',
            'nuts2-2013-data',
            'Gridded_GDP_nuts2-2013-data'
            }
        self.assertEqual(len(expected_layers), len(layers))
        for name in layers:
            self.assertIn(name, expected_layers)

    def test_reload_project_from_url(self):
        driver = self.driver
        driver.get(
            self.base_url + "?reload=mthh/dac7915b55a3d0704af0a04ebe43fe04")
        if not self.wait_until_overlay_disapear(5):
            self.fail("Overlay not hiding / Project reloading")
        layers = driver.find_elements_by_css_selector('#svg_map > .layer')
        map_elems = driver.find_elements_by_css_selector('#svg_map > *')
        expected_results = [
            'L_Sphere', 'L_World', 'L_world_data',
            'L_Typo_has_data_world_data', 'L_Graticule']
        self.assertEqual(len(layers), 5)
        for expected_id, layer in zip(expected_results, layers):
            self.assertEqual(expected_id, layer.get_attribute('id'))

        self.assertEqual(len(map_elems), 8)
        self.assertEqual(map_elems[7].get_attribute('id'), 'map_title')

    def test_downloads(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")
        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts2_data")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        # Open the appropriate menu:
        self.open_menu_section(5)

        # Test export to svg:
        Select(
            driver.find_element_by_id("select_export_type")
            ).select_by_value("svg")
        time.sleep(0.2)
        driver.find_element_by_id("export_button_section5b").click()
        time.sleep(1)
        with open(self.tmp_folder + "export.svg", "r") as f:
            svg_data = f.read()
        self.assertIn('<svg', svg_data)
        self.assertIn('nuts2-2013-data', svg_data)
        os.remove(self.tmp_folder + "export.svg")

        # Test export to png:
        Select(
            driver.find_element_by_id("select_export_type")
            ).select_by_value("png")
        time.sleep(0.2)
        driver.find_element_by_id("export_button_section5b").click()
        time.sleep(1)
        with open(self.tmp_folder + "export.png", "rb") as f:
            png_data = f.read()
        self.assertGreater(len(png_data), 0)
        time.sleep(0.1)
        os.remove(self.tmp_folder + "export.png")

        # Test export to GeoJSON (from the source layer):
        Select(
            driver.find_element_by_id("select_export_type")
            ).select_by_value("geo")
        time.sleep(0.2)
        Select(
            driver.find_element_by_id("layer_to_export")
            ).select_by_visible_text("nuts2-2013-data")
        Select(
            driver.find_element_by_id("datatype_to_use")
            ).select_by_value("GeoJSON")
        driver.find_element_by_id("export_button_section5b").click()

        time.sleep(2)
        with open(self.tmp_folder + "nuts2-2013-data.geojson", "r") as f:
            raw_geojson = f.read()
        parsed_geojson = json.loads(raw_geojson)
        self.assertIn("features", parsed_geojson)
        self.assertIn("type", parsed_geojson)
        self.assertEqual(len(parsed_geojson["features"]), 323)
        os.remove(self.tmp_folder + "nuts2-2013-data.geojson")

        # Test export to KML (from the source layer):
        Select(
            driver.find_element_by_id("layer_to_export")
            ).select_by_visible_text("nuts2-2013-data")
        Select(
            driver.find_element_by_id("datatype_to_use")
            ).select_by_value("KML")
        driver.find_element_by_id("export_button_section5b").click()

        time.sleep(3)
        with open(self.tmp_folder + "nuts2-2013-data.kml", "r") as f:
            raw_kml_file = f.read()
        self.assertIn("<kml xmlns=", raw_kml_file)
        os.remove(self.tmp_folder + "nuts2-2013-data.kml")

        # Test export to GML (from the source layer):
        Select(
            driver.find_element_by_id("layer_to_export")
            ).select_by_visible_text("nuts2-2013-data")
        Select(
            driver.find_element_by_id("datatype_to_use")
            ).select_by_value("GML")
        driver.find_element_by_id("export_button_section5b").click()

        time.sleep(2)
        self.assertEqual(
            True, os.path.exists(self.tmp_folder + "nuts2-2013-data.zip"))
        os.remove(self.tmp_folder + "nuts2-2013-data.zip")

        # Test export to Shapefile (from the source layer):
        Select(
            driver.find_element_by_id("layer_to_export")
            ).select_by_visible_text("nuts2-2013-data")
        Select(
            driver.find_element_by_id("datatype_to_use")
            ).select_by_value("ESRI Shapefile")
        driver.find_element_by_id("export_button_section5b").click()

        time.sleep(2)
        self.assertEqual(
            True, os.path.exists(self.tmp_folder + "nuts2-2013-data.zip"))
        os.remove(self.tmp_folder + "nuts2-2013-data.zip")

    def test_about_box_and_version(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#help_btn", 0.2)
        version_string = driver.find_element_by_css_selector(
            '.about_content > p > span').text
        self.assertIn('Magrit version 0.', version_string)

        bouton_ressources = driver.find_elements_by_css_selector(
            '.about_content > p > button')
        self.assertEqual(len(bouton_ressources), 3)
        driver.find_element_by_css_selector(
            'button.swal2-cancel').click()

    def test_downgrading_target_layer(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition('#sample_link')

        Select(
            driver.find_element_by_css_selector('select.sample_target')
            ).select_by_value('martinique')
        driver.find_element_by_css_selector('.btn_ok').click()
        # Add a new target layer:
        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()
        self.validTypefield()

        # Downgrade it with the dedicated button in the section 1
        # of the left menu:
        driver.find_element_by_id('downgrade_target').click()

        # Confirmation message:
        self.waitClickButtonSwal()

    def test_promoting_result_layer_to_target(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition('#sample_link')

        Select(
            driver.find_element_by_css_selector('select.sample_target')
            ).select_by_value('martinique')
        driver.find_element_by_css_selector('.btn_ok').click()

        # Add a target layer:
        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()
        self.validTypefield()

        # Render a map not allowing to promote its result:
        self.open_menu_section(2)
        self.clickWaitTransition('#button_choro')
        output_name = driver.find_element_by_id('Choro_output_name')
        output_name.clear()
        output_name.send_keys('choro_martinique')
        driver.find_element_by_id('choro_yes').click()
        time.sleep(0.1)
        # The icon allowing to promote the layer should not be present:
        elem_promote = driver.find_element_by_css_selector(
            "li.L_choro_martinique"
            ).find_elements_by_css_selector("#replace_button")
        self.assertEqual(len(elem_promote), 0)

        # Render a map allowing to promote its result:
        self.open_menu_section(2)
        self.clickWaitTransition('#button_cartogram')
        Select(driver.find_element_by_css_selector(
            "select.params")).select_by_visible_text('Dougenik & al. (1985)')
        Select(driver.find_element_by_id(
            "Anamorph_field")
            ).select_by_visible_text('P13_POP')
        output_name = driver.find_element_by_id('Anamorph_output_name')
        output_name.clear()
        output_name.send_keys('carto_doug')
        driver.find_element_by_id('Anamorph_yes').click()

        button_ok = self.get_button_ok_displayed()
        button_ok.click()
        time.sleep(0.1)
        # The icon allowing to promote the layer should be present:
        elem_promote = driver.find_element_by_css_selector(
            "li.L_carto_doug"
            ).find_element_by_css_selector("#replace_button")
        self.assertNotEqual(elem_promote, None)
        # Click on it to promote the layer:
        elem_promote.click()
        # Confirmation message:
        self.waitClickButtonSwal()

    def test_promoting_layout_layer_to_target_layer(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition('#sample_link')
        # Add a layout layer:
        Select(
            driver.find_element_by_css_selector('select.sample_target')
            ).select_by_value('martinique')
        driver.find_element_by_css_selector('.btn_ok').click()

        self.waitClickButtonTypeLayer(type_layer='layout')
        self.waitClickButtonSwal()

        # Promote it to target layer:
        self.open_menu_section(3)
        elem_promote = driver.find_element_by_css_selector(
            "li.L_martinique"
            ).find_element_by_css_selector("#replace_button")
        self.assertNotEqual(elem_promote, None)
        elem_promote.click()
        # Confirmation message:
        self.waitClickButtonSwal()

        # Render a choropleth with it:
        self.open_menu_section(2)
        self.clickWaitTransition('#button_choro')
        output_name = driver.find_element_by_id('Choro_output_name')
        output_name.clear()
        output_name.send_keys('choro_martinique')
        driver.find_element_by_id('choro_yes').click()
        time.sleep(0.1)
        # The icon allowing to promote this result layer
        # should not be present:
        elem_promote = driver.find_element_by_css_selector(
            "li.L_choro_martinique"
            ).find_elements_by_css_selector("#replace_button")
        self.assertEqual(len(elem_promote), 0)

    def test_f_Typo(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")

        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts2_data")
        driver.find_element_by_css_selector(".btn_ok").click()

        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(3)
        driver.find_element_by_css_selector(
            "li.L_nuts2-2013-data"
            ).find_elements_by_css_selector("#browse_data_button")[0].click()
        time.sleep(1)

        # Test adding fields to the existing table :
        self.clickWaitTransition("#add_field_button")
        Select(
            driver.find_element_by_id("type_content_select")
            ).select_by_value("string_field")
        time.sleep(0.3)
        in_elem = driver.find_element_by_css_selector(
            '#field_div1 > p > input')
        in_elem.clear()
        in_elem.send_keys('Pays')

        # One categorical field (country) obtained
        # by truncating ids of nuts2 features :
        Select(driver.find_element_by_css_selector(
            "#field_div1 > select")).select_by_visible_text("id")
        Select(driver.find_element_by_xpath(
            "//div[@id='field_div1']/select[2]")).select_by_value("truncate")
        driver.find_element_by_id("val_opt").clear()
        driver.find_element_by_id("val_opt").send_keys("2")
        driver.find_element_by_css_selector(
            ".addFieldBox").find_elements_by_css_selector(
            ".btn_ok")[0].click()
        time.sleep(0.5)
        self.click_elem_retry(
            driver.find_element_by_id(
                "browse_data_box").find_elements_by_css_selector(
                ".btn_ok")[0])
        time.sleep(0.5)
        self.open_menu_section(2)
        self.clickWaitTransition("#button_typo")
        Select(
            driver.find_element_by_id("Typo_field_1")
            ).select_by_value("Pays")
        time.sleep(0.1)

        driver.find_element_by_id('Typo_output_name').clear()
        driver.find_element_by_id('Typo_output_name').send_keys('result_layer')

        # Valid theses properties and click on the "render" button :
        driver.find_element_by_id("Typo_yes").click()
        time.sleep(0.3)
        # Confirm the fact that there is a lot of features
        # for this kind of representation :
        self.waitClickButtonSwal()

        time.sleep(1)

        if not self.try_element_present(By.CSS_SELECTOR, '.lgdf_L_result_layer', 5):
            self.fail("Legend not displayed for Categorical map")

        self._verif_legend_hide_show_button('result_layer')

    def test_f_TypoPicto(self):
        driver = self.driver
        driver.get(self.base_url)
        # Open the box of sample layers:
        self.clickWaitTransition("#sample_link")
        # Select the "Martinique" layer:
        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("martinique")
        driver.find_element_by_css_selector(".btn_ok").click()

        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()

        # Valid the type of each field:
        self.validTypefield()

        self.open_menu_section(2)
        self.clickWaitTransition("#button_typosymbol")

        Select(
            driver.find_element_by_id("field_Symbol")
            ).select_by_visible_text("STATUT")

        driver.find_element_by_id('selec_Symbol').click()
        self.waitClickButtonSwal()
        time.sleep(0.3)

        # Change a symbol ...
        driver.find_element_by_css_selector('#line_1 > p').click()
        time.sleep(0.3)
        driver.find_element_by_id('p_poi_place_city').click()

        # .. and verify that all our symbol are displayed:
        nb_symbols = len(
            driver.find_elements_by_css_selector('#symbols_select > p'))
        self.assertEqual(nb_symbols, 92)

        driver.find_elements_by_css_selector('.btn_ok')[1].click()
        time.sleep(0.3)

        # Change another symbol
        driver.find_element_by_css_selector('#line_2 > p').click()
        time.sleep(0.3)
        driver.find_element_by_id('p_tourist_beach').click()
        driver.find_elements_by_css_selector('.btn_ok')[1].click()
        time.sleep(0.3)

        # Validate our choice of symbols:
        driver.find_elements_by_css_selector('.btn_ok')[0].click()

        # Render the layer
        driver.find_element_by_id("yesTypoSymbols").click()
        time.sleep(0.3)

        if not self.try_element_present(By.CSS_SELECTOR, '.lgdf_L_Symbols_martinique', 5):
            self.fail("Legend not displayed for Categorical map")

        self._verif_legend_hide_show_button('Symbols_martinique')

    def test_rename(self):
        driver = self.driver
        driver.get(self.base_url)

        # Add a sample layer:
        self.clickWaitTransition("#sample_link")
        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts2_data")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()
        self.validTypefield()
        self.open_menu_section(3)

        # Change the name of the target layer:
        self.click_elem_retry(
            driver.find_element_by_css_selector(
                "li.L_nuts2-2013-data > div > .style_target_layer"))
        time.sleep(0.3)
        namezone = driver.find_element_by_css_selector('input#lyr_change_name')
        namezone.clear()
        namezone.send_keys('SomeNewNameForMyLayer')
        driver.find_element_by_css_selector(
            ".styleBox").find_elements_by_css_selector(
            ".btn_ok")[0].click()
        time.sleep(0.1)
        current_layers, data_layer_name = driver.execute_script('''
            return [
                Object.keys(data_manager.current_layers),
                Object.keys(data_manager.user_data)
            ];
        ''')
        self.assertNotIn('nuts2-2013-data', current_layers)
        self.assertNotIn('nuts2-2013-data', data_layer_name)
        self.assertIn('SomeNewNameForMyLayer', current_layers)
        self.assertIn('SomeNewNameForMyLayer', data_layer_name)

        # Render a smoothed map on our renamed layer...
        self.open_menu_section(2)
        self.clickWaitTransition("#button_smooth")
        output_name = driver.find_element_by_id("stewart_output_name")
        output_name.clear()
        # ... and ask for a weird name:
        output_name.send_keys("W€ird output n@me")
        driver.find_element_by_id("stewart_yes").click()
        self.waitClickButtonSwal()
        time.sleep(0.5)
        current_layers, result_layer_name = driver.execute_script('''
            return [
                Object.keys(data_manager.current_layers),
                Object.keys(data_manager.result_data)
            ];
        ''')
        # Problematic char have been escaped correctly:
        self.assertIn('W_ird_output_n_me', current_layers)
        self.assertIn('W_ird_output_n_me', result_layer_name)

        # Change the name of the result layer for something more meaningful:
        self.click_elem_retry(
            driver.find_element_by_css_selector(
                "li.L_W_ird_output_n_me > div > .style_target_layer"))
        time.sleep(0.6)
        namezone = driver.find_element_by_css_selector('input#lyr_change_name')
        namezone.clear()
        namezone.send_keys('Smoothed_result')
        driver.find_element_by_css_selector(
            ".styleBox").find_elements_by_css_selector(
            ".btn_ok")[0].click()

        # The new name is correctly in use and the old name is not present:
        current_layers, result_layer_name = driver.execute_script('''
            return [
                Object.keys(data_manager.current_layers),
                Object.keys(data_manager.result_data)
            ];
        ''')
        self.assertIn('Smoothed_result', current_layers)
        self.assertIn('Smoothed_result', result_layer_name)
        self.assertNotIn('W_ird_output_n_me', current_layers)
        self.assertNotIn('W_ird_output_n_me', result_layer_name)

        # Verify that there is no trace of the old name in the whole document:
        self.assertNotIn('W_ird_output_n_me', driver.page_source)

        # The result can be exported correctly:
        self._verif_export_result('Smoothed_result')

    def test_f_Stewart(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")

        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts2_data")
        driver.find_element_by_css_selector(".btn_ok").click()

        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(2)
        self.clickWaitTransition("#button_smooth")

        driver.find_element_by_id("stewart_nb_class").clear()
        driver.find_element_by_id("stewart_nb_class").send_keys("7")
        driver.find_element_by_id("stewart_span").clear()
        driver.find_element_by_id("stewart_span").send_keys("60")
        Select(
            driver.find_element_by_id("stewart_mask")
            ).select_by_visible_text("nuts2-2013-data")
        output_name = driver.find_element_by_id("stewart_output_name")
        output_name.clear()
        output_name.send_keys('my_result_0')
        driver.find_element_by_id("stewart_yes").click()
        self.waitClickButtonSwal()
        # The legend is displayed :
        if not self.try_element_present(By.CSS_SELECTOR, ".lgdf_L_my_result_0", 5):
            self.fail("Legend not displayed on stewart")

        self._verif_legend_hide_show_button('my_result_0')

        # The legend contains the correct number of class :
        legend_elems = driver.find_element_by_class_name(
            'lgdf_L_my_result_0').find_elements_by_css_selector(
                'rect:not(#under_rect)')
        self.assertEqual(len(legend_elems), 7)
        self._verif_export_result('my_result_0')

        # Test with an other layer, asking for 9 class and no mask :
        self.open_menu_section('2b')
        driver.find_element_by_id("stewart_nb_class").clear()
        driver.find_element_by_id("stewart_nb_class").send_keys("9")
        driver.find_element_by_id("stewart_span").clear()
        driver.find_element_by_id("stewart_span").send_keys("115")
        Select(
            driver.find_element_by_id("stewart_mask")
            ).select_by_visible_text("None")
        output_name = driver.find_element_by_id("stewart_output_name")
        output_name.clear()
        output_name.send_keys('my_result_1')
        driver.find_element_by_id("stewart_yes").click()
        self.waitClickButtonSwal()
        # The legend is displayed :
        if not self.try_element_present(By.CSS_SELECTOR, ".lgdf_L_my_result_1", 5):
            self.fail("Legend not displayed on stewart")

        self._verif_legend_hide_show_button('my_result_1')

        # The legend contains the correct number of class :
        legend_elems = driver.find_element_by_class_name(
            'lgdf_L_my_result_1').find_elements_by_css_selector(
                'rect:not(#under_rect)')
        self.assertEqual(len(legend_elems), 9)
        self._verif_export_result('my_result_1')

        # Test with specifing custom break value :
        self.open_menu_section('2b')
        # This number of class is goona be overriden by our break values :
        driver.find_element_by_id("stewart_nb_class").clear()
        driver.find_element_by_id("stewart_nb_class").send_keys("10")
        driver.find_element_by_id("stewart_span").clear()
        driver.find_element_by_id("stewart_span").send_keys("115")
        Select(
            driver.find_element_by_id("stewart_mask")
            ).select_by_visible_text("None")
        custom_breaks = driver.find_element_by_id('stewart_breaks')
        custom_breaks.clear()
        custom_breaks.send_keys(
            '0 - 800000 - 2150000 - 4000000 - 7575000 - '
            '13550000 - 25432798.18274938')
        output_name = driver.find_element_by_id("stewart_output_name")
        output_name.clear()
        output_name.send_keys('my_result_2')
        driver.find_element_by_id("stewart_yes").click()
        self.waitClickButtonSwal()
        # The legend is displayed :
        if not self.try_element_present(By.CSS_SELECTOR, ".lgdf_L_my_result_2", 5):
            self.fail("Legend not displayed on stewart")

        self._verif_legend_hide_show_button('my_result_2')

        # The legend contains the correct number of class :
        legend_elems = driver.find_element_by_class_name(
            'lgdf_L_my_result_2').find_elements_by_css_selector(
                'rect:not(#under_rect)')
        self.assertEqual(len(legend_elems), 6)
        self._verif_export_result('my_result_2')

    def test_f_Waffle(self):
        driver = self.driver
        driver.get(self.base_url)
        # Open the box of sample layers:
        self.clickWaitTransition("#sample_link")
        # Select the "Martinique" layer:
        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("martinique")
        driver.find_element_by_css_selector(".btn_ok").click()

        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()

        # Valid the type of each field:
        self.validTypefield()

        # Open the table for the Martinique layer:
        self.open_menu_section(3)
        driver.find_element_by_css_selector(
            "li.L_martinique"
            ).find_elements_by_css_selector("#browse_data_button")[0].click()
        time.sleep(1)

        # Create a new field from the total stock of dwellings (P13_LOG)
        # and the stock of empty dwellings (P13_LOGVAC)
        # to obtain the stock of non empty dwellings (P13_LOGNONVAC) :
        self.clickWaitTransition("#add_field_button")
        in_elem = driver.find_element_by_css_selector(
            '#field_div1 > p > input')
        in_elem.clear()
        in_elem.send_keys("P13_LOGNONVAC")
        Select(driver.find_element_by_css_selector(
            "#field_div1 > select")).select_by_visible_text("P13_LOG")
        Select(driver.find_element_by_xpath(
            "//div[@id='field_div1']/select[3]")
            ).select_by_visible_text("P13_LOGVAC")
        Select(driver.find_element_by_xpath(
            "//div[@id='field_div1']/select[2]")).select_by_visible_text("-")
        driver.find_element_by_css_selector(
            ".addFieldBox").find_elements_by_css_selector(
            ".btn_ok")[0].click()
        time.sleep(0.4)
        self.click_elem_retry(
            driver.find_element_by_id(
                "browse_data_box").find_elements_by_css_selector(
                ".btn_ok")[0])
        time.sleep(0.4)

        #  Test the waffle functionnality :
        self.open_menu_section(2)
        self.clickWaitTransition("#button_two_stocks")

        # Select the two appropriate fields :
        s = Select(driver.find_element_by_id("TwoStocks_fields"))
        s.select_by_visible_text('P13_LOGVAC')
        s.select_by_visible_text('P13_LOGNONVAC')
        driver.find_element_by_id("TwoStocks_waffle_WidthRow")

        # Set the number of symbol by line:
        elem = driver.find_element_by_id("TwoStocks_waffle_WidthRow")
        elem.clear()
        elem.send_keys('5')

        # Create the new layer:
        driver.find_element_by_id("twoStocks_yes").click()
        time.sleep(0.2)

        # Is the legend displayed ?
        if not self.try_element_present(By.ID, "legend_root_waffle", 5):
            self.fail("Legend not displayed on waffle map")

        # Can we hide and redisplay the legend ?
        self._verif_legend_hide_show_button('martinique_Waffle')

    def test_f_Cartogram_new_field(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")
        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts2_data")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(3)
        driver.find_element_by_css_selector(
            "li.L_nuts2-2013-data"
            ).find_elements_by_css_selector("#browse_data_button")[0].click()
        time.sleep(1)

        # Test adding fields to the existing table :
        self.clickWaitTransition("#add_field_button")

        in_elem = driver.find_element_by_css_selector(
            '#field_div1 > p > input')
        in_elem.clear()
        in_elem.send_keys("NewFieldName3")

        # One field based on an operation betweeen two numerical variables :
        Select(driver.find_element_by_css_selector(
            "#field_div1 > select")).select_by_visible_text("GDP")
        Select(driver.find_element_by_xpath(
            "//div[@id='field_div1']/select[3]")).select_by_visible_text("POP")
        Select(driver.find_element_by_xpath(
            "//div[@id='field_div1']/select[2]")).select_by_visible_text("/")
        driver.find_element_by_css_selector(
            ".addFieldBox").find_elements_by_css_selector(
            ".btn_ok")[0].click()
        time.sleep(0.4)

        self.clickWaitTransition("#add_field_button")
        in_elem = driver.find_element_by_css_selector(
            '#field_div1 > p > input')
        in_elem.clear()
        in_elem.send_keys("NewFieldName2")

        # One field based on an operation betweeen
        # a numerical variable and a constant :
        Select(driver.find_element_by_css_selector(
            "#field_div1 > select")).select_by_visible_text("POP")
        Select(driver.find_element_by_xpath(
            "//div[@id='field_div1']/select[2]")
            ).select_by_visible_text("/")
        Select(driver.find_element_by_xpath(
            "//div[@id='field_div1']/select[3]")
            ).select_by_value("user_const_value")
        driver.find_element_by_id("val_opt").clear()
        driver.find_element_by_id("val_opt").send_keys("1000")
        Select(driver.find_element_by_xpath(
            "//div[@id='field_div1']/select[2]")).select_by_visible_text("*")
        driver.find_element_by_css_selector(
            ".addFieldBox").find_elements_by_css_selector(
            ".btn_ok")[0].click()
        time.sleep(0.4)

        self.clickWaitTransition("#add_field_button")
        in_elem = driver.find_element_by_css_selector(
            '#field_div1 > p > input')
        in_elem.clear()
        in_elem.send_keys("NewFieldName1")

        # One field based on an operation on a char string field
        Select(driver.find_element_by_id(
            "type_content_select")).select_by_value("string_field")
        Select(driver.find_element_by_xpath(
            "//div[@id='field_div1']/select[2]")).select_by_value("truncate")
        driver.find_element_by_id("val_opt").clear()
        driver.find_element_by_id("val_opt").send_keys("2")
        driver.find_element_by_css_selector(
            ".addFieldBox").find_elements_by_css_selector(
            ".btn_ok")[0].click()
        time.sleep(0.4)
        self.click_elem_retry(
            driver.find_element_by_id(
                "browse_data_box").find_elements_by_css_selector(
                ".btn_ok")[0])
        time.sleep(0.4)

        self.open_menu_section(2)
        #  Test the dougenik cartogram functionnality...
        self.clickWaitTransition("#button_cartogram")

        Select(driver.find_element_by_css_selector(
            "select.params")).select_by_visible_text("Dougenik & al. (1985)")

        #  ... using one of these previously computed field :
        Select(driver.find_element_by_id(
            "Anamorph_field")
            ).select_by_visible_text("GDP")
        output_name = driver.find_element_by_id('Anamorph_output_name')
        output_name.clear()
        output_name.send_keys('carto_doug')
        driver.find_element_by_id("Anamorph_yes").click()
        button_ok = self.get_button_ok_displayed()
        button_ok.click()

        self._verif_export_result('carto_doug')

#        Select(driver.find_element_by_css_selector(
#            "select.params")).select_by_visible_text("Dougenik & al. (1985)")

        self.open_menu_section('2b')
        #  Test the olson cartogram functionnality...
        Select(driver.find_element_by_css_selector(
            "select.params")).select_by_visible_text("Olson (2005)")

        Select(driver.find_element_by_id(
            "Anamorph_field")).select_by_visible_text("GDP")
        output_name.clear()
        output_name.send_keys('carto_olson')
        driver.find_element_by_id("Anamorph_yes").click()
        button_ok = self.get_button_ok_displayed()
        button_ok.click()

        self._verif_export_result('carto_olson')

    def test_f_Choro_new_field(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")

        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("martinique")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()
        time.sleep(0.3)

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(3)
        self.click_elem_retry(
            driver.find_element_by_css_selector(
                "li.L_martinique").find_element_by_css_selector(
                "#browse_data_button"))
        time.sleep(0.5)

        self.clickWaitTransition("#add_field_button")
        #  Computing a new field on a layer with more than 3100 features
        #  ... will delegate the operation to the server :
        Select(
            driver.find_element_by_css_selector("#field_div1 > select")
            ).select_by_visible_text("P13_LOG")
        Select(
            driver.find_element_by_xpath("//div[@id='field_div1']/select[2]")
            ).select_by_visible_text("/")
        Select(
            driver.find_element_by_xpath("//div[@id='field_div1']/select[3]")
            ).select_by_visible_text("P13_POP")
        in_elem = driver.find_element_by_css_selector(
            '#field_div1 > p > input')
        in_elem.clear()
        in_elem.send_keys("Ratio")
        driver.find_element_by_css_selector(
            ".addFieldBox").find_element_by_css_selector(".btn_ok").click()
        self.click_elem_retry(
            driver.find_element_by_id(
                "browse_data_box").find_element_by_css_selector(".btn_ok"))

        self.open_menu_section(2)
        self.clickWaitTransition("#button_choro")
        #  Let's use this new field to render a choropleth map :
        Select(
            driver.find_element_by_id("choro_field1")
            ).select_by_visible_text("Ratio")
        driver.find_element_by_css_selector("option[value=\"Ratio\"]").click()
        driver.find_element_by_id("ico_others").click()
        self.click_elem_retry(
            driver.find_element_by_id(
                "discretiz_charts").find_elements_by_css_selector(
                ".btn_ok")[0])
        output_name = driver.find_element_by_id('Choro_output_name')
        output_name.clear()
        output_name.send_keys('my_result_layer')
        driver.find_element_by_id("choro_yes").click()
        time.sleep(1)  # Little delay for the map to be rendered

        if not self.try_element_present(By.ID, "legend_root", 5):
            self.fail("Legend not displayed on choropleth")

        self._verif_legend_hide_show_button('my_result_layer')

    def test_f_Discont_new_field(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")
        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("martinique")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(2)
        self.clickWaitTransition("#button_discont")

        Select(
            driver.find_element_by_id("field_Discont")
            ).select_by_visible_text("P13_POP")
        Select(
            driver.find_element_by_id("Discont_discKind")
            ).select_by_visible_text("Quantiles")
        if not self.is_element_present(By.ID, "color_Discont"):
            self.fail("Missing features in the interface")
        driver.execute_script(
            "document.getElementById('color_Discont').value = '#da2929';")
        output_name = driver.find_element_by_id("Discont_output_name")
        output_name.clear()
        output_name.send_keys('my_result_layer')
        driver.find_element_by_id("yes_Discont").click()
        time.sleep(1)  # Delay for the discontinuities to be computed
        if not self.try_element_present(By.ID, "legend_root_lines_class", 5):
            self.fail("Legend won't display")

        self._verif_legend_hide_show_button("my_result_layer")

        self._verif_export_result('my_result_layer')

    def test_f_PropSymbolsTypo(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition('#sample_link')
        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value('brazil')

        driver.find_element_by_css_selector('.btn_ok').click()
        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()
        self.validTypefield()
        self.open_menu_section(2)
        self.clickWaitTransition('#button_proptypo')
        Select(
            driver.find_element_by_id('PropSymbolTypo_field_1')
            ).select_by_visible_text('Pop2014')
        Select(
            driver.find_element_by_id('PropSymbolTypo_field_2')
            ).select_by_visible_text('REGIONS')
        output_name = driver.find_element_by_id('PropSymbolTypo_output_name')
        output_name.clear()
        output_name.send_keys('my_result_layer')

        driver.find_element_by_id("Typo_class").click()
        time.sleep(0.2)
        # self.waitClickButtonSwal()
        self.click_elem_retry(
            driver.find_element_by_id(
                "categorical_box").find_elements_by_css_selector(
                ".btn_ok")[0])

        driver.find_element_by_id('propTypo_yes').click()
        time.sleep(1.5)
        if not self.try_element_present(By.ID, "legend_root_symbol", 5) \
                or not self.try_element_present(By.ID, 'legend_root'):
            self.fail("Legend won't display on Prop Symbol Choro")

        self._verif_legend_hide_show_button('my_result_layer')

    def test_f_PropSymbolsChoro_and_remove(self):
        driver = self.driver
        driver.get(self.base_url)
        # Add a sample layer :
        self.clickWaitTransition('#sample_link')
        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value('martinique')
        driver.find_element_by_css_selector('.btn_ok').click()
        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()
        self.validTypefield()
        time.sleep(0.4)

        # Remove it to load another one:
        driver.find_element_by_id('remove_target').click()
        self.waitClickButtonSwal()

        # Add the layer we really want to add:
        self.clickWaitTransition('#sample_link')
        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value('brazil')
        driver.find_element_by_css_selector('.btn_ok').click()
        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()
        self.validTypefield()

        # Render a "stock and ratio" map with its data:
        self.open_menu_section(2)
        self.clickWaitTransition('#button_choroprop')
        Select(
            driver.find_element_by_id('PropSymbolChoro_field_1')
            ).select_by_visible_text('Pop2014')
        Select(
            driver.find_element_by_id('PropSymbolChoro_field_2')
            ).select_by_visible_text('popdensity2014')
        driver.find_element_by_id("ico_jenks").click()

        # A "Sparkline" chart should be drawn in a canvas:
        if not self.is_element_present(By.CSS_SELECTOR, "#container_sparkline_propsymbolchoro > canvas"):
            self.fail("Missing mini sparkline canvas in the interface")
        output_name = driver.find_element_by_id('PropSymbolChoro_output_name')
        output_name.clear()
        output_name.send_keys('my_result_layer')

        driver.find_element_by_id('propChoro_yes').click()
        time.sleep(1.5)
        if not self.try_element_present(By.ID, "legend_root_symbol", 5) \
                or not self.try_element_present(By.ID, 'legend_root'):
            self.fail("Legend won't display on Prop Symbol Choro")

        self._verif_legend_hide_show_button('my_result_layer')

        # The number of layers in the "data_manager.current_layers" have to
        # be the same as the number of layers displayed in the UI
        # in the "Gestion des couches"/"Layers" section in our left menu:
        nb_layer_t1 = driver.execute_script(
            '''a = Object.keys(data_manager.current_layers).length;
            return a;''')
        self.assertEqual(nb_layer_t1, 2)
        nb_layer_t2 = driver.execute_script(
            '''a = document.querySelector('.layer_list').childNodes.length;
            return a;''')
        self.assertEqual(nb_layer_t2, 2)

    def test_f_PropSymbols(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")

        Select(
            driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("grandparismunicipalities")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonTypeLayer(type_layer='target')
        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(2)
        self.clickWaitTransition("#button_prop")

        Select(driver.find_element_by_id(
            "PropSymbol_field_1")).select_by_visible_text("MENAGES_FISCAUX")
        Select(driver.find_element_by_id(
            "PropSymbol_symbol")).select_by_value("rect")
        Select(
            driver.find_element_by_id("PropSymbol_nb_colors")
            ).select_by_value("2")
        driver.find_element_by_id("PropSymbol_break_val").clear()
        driver.find_element_by_id("PropSymbol_break_val").send_keys("14553")

        if not self.is_element_present(By.ID, "PropSymbol_color1") \
                or not self.is_element_present(By.ID, "PropSymbol_color2"):
            self.fail("Missing features in the interface")

        driver.execute_script(
            "document.getElementById('PropSymbol_color1').value = '#e3a5f3';")
        driver.execute_script(
            "document.getElementById('PropSymbol_color1').value = '#ffff00';")
        output_name = driver.find_element_by_id("PropSymbol_output_name")
        output_name.clear()
        output_name.send_keys('my_result_layer')
        driver.find_element_by_id("PropSymbol_yes").click()
        time.sleep(1.5)

        if not self.try_element_present(By.ID, "legend_root_symbol", 5):
            self.fail("Legend won't display")
        time.sleep(0.1)

        self._verif_legend_hide_show_button('my_result_layer')

        # Test that labels are correctly generated from a layer of prop symbols
        self.click_elem_retry(
            driver.find_element_by_css_selector(
                "li.L_my_result_layer > div > .style_target_layer"))
        time.sleep(0.5)
        self.clickWaitTransition("#generate_labels")
        Select(
            driver.find_element_by_css_selector("#label_box_field")
            ).select_by_value("LIBCOM")
        self.waitClickButtonSwal()
        time.sleep(1)
        self.click_element_with_retry(".btn_ok")
        time.sleep(0.5)
        labels = driver.find_element_by_id(
            "L_Labels_LIBCOM_my_result_layer"
            ).find_elements_by_css_selector("text")
        self.assertIsInstance(labels, list)
        self.assertGreater(len(labels), 0)

#    def test_add_gml_format(self):
#        driver = self.driver
#        driver.get(self.base_url)
#        with open('tests/load_gml.js') as f:
#            script = f.read()
#        driver.execute_script(script)
#        time.sleep(0.3)
#        self.waitClickButtonSwal()
#        # Valid the type of each field :
#        self.validTypefield()
#        time.sleep(1)
#
#        # Field order was preserved :
#        fields = driver.execute_script('''
#            names = window.current_layers["Ecuador"].fields_type.map(ft => ft.name);
#            return names;
#            ''');
#        expected_fields = [
#            "fid", "ID", "ISO", "NAME",
#            "AREA", "POP_2001", "POP_2010",
#            "POP_DEN", "POP_VAR1", "POP_VAR2"]
#        for f1, f2 in zip(fields, expected_fields):
#            self.assertEqual(f1, f2)

    def _verif_legend_hide_show_button(self, layer_name):
        driver = self.driver
        button_legend = driver.find_element_by_css_selector(
            "li.L_" + layer_name
            ).find_element_by_css_selector('#legend_button')
        legends = driver.find_elements_by_css_selector(".lgdf_L_" + layer_name)

        # Hide legend(s) for this representation :
        button_legend.click()
        time.sleep(0.1)
        for lgd in legends:
            self.assertEqual(False, lgd.is_displayed())

        # Redisplay legend(s)
        button_legend.click()
        time.sleep(0.1)
        for lgd in legends:
            self.assertEqual(True, lgd.is_displayed())

    def _verif_export_result(self, layer_name, layer_format="GeoJSON"):
        driver = self.driver
        self.open_menu_section(5)
        time.sleep(0.2)
        Select(
            driver.find_element_by_id("select_export_type")
            ).select_by_value("geo")
        time.sleep(0.2)
        Select(
            driver.find_element_by_id("layer_to_export")
            ).select_by_visible_text(layer_name)
        Select(
            driver.find_element_by_id("datatype_to_use")
            ).select_by_value(layer_format)
        driver.find_element_by_id("export_button_section5b").click()

        time.sleep(2)
        with open(self.tmp_folder + layer_name + ".geojson", "r") as f:
            raw_geojson = f.read()
        parsed_geojson = json.loads(raw_geojson)
        self.assertIn("features", parsed_geojson)
        self.assertIn("type", parsed_geojson)
        os.remove(self.tmp_folder + layer_name + ".geojson")

    def _verif_dbl_click_open_ctx_menu(self, elem, info):
        self.make_double_click(elem)
        time.sleep(0.1)
        if not self.try_element_present(By.CSS_SELECTOR, ".context-menu"):
            self.fail(
                "Context menu of {} won't display on dblclick".format(info))
        self.click_elem_retry(self.driver.find_element_by_id('svg_map'))

    def _verif_context_menu(self, elem, info):
        self.make_context_click(elem)
        time.sleep(0.1)
        if not self.try_element_present(By.CSS_SELECTOR, ".context-menu"):
            self.fail("Context menu of {} won't display".format(info))
        self.click_elem_retry(self.driver.find_element_by_id('svg_map'))


if __name__ == "__main__":
    unittest.main()
