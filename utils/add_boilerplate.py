# Copyright (c) 2020-2024 CRS4
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.


import datetime
import io
import logging
import os
import re
from typing import Tuple, Union

from colorama import Fore, Style

# configure logging
logger = logging.getLogger(__name__)


SOURCE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir)
# SOURCE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src") # uncomment this line to test the script
THIS_YEAR = datetime.date.today().year
C_YEAR = f"2020-{THIS_YEAR}"
LICENSE_FN = os.path.join(SOURCE_PATH, "LICENSE")
COM_MAP = {
    ".py": "#",
    ".ts": ("/*", "*/"),
    ".js": ("/*", "*/"),
    ".html": ("<!--", "-->"),
    ".css": ("/*", "*/"),
    ".yaml": "#",
    ".yml": "#",
}
EXCLUDE_FILES = set()
EXCLUDE_DIRS = {"build", "dist", "venv", "node_modules"}

PATTERN = re.compile(r"Copyright \(c\) [0-9-]+")
REPL = f"Copyright (c) {C_YEAR}"

# Result codes
ERROR = -1
UNCHANGED = 0
UPDATED = 1
CREATED = 2


def get_boilerplate():
    with io.open(LICENSE_FN, "rt") as f:
        content = f.read()
    return content[content.find("Copyright") :]


def comment(text, com: Union[str, Tuple[str, str]] = "#"):
    # check comment delimiters type
    if not isinstance(com, str) and not isinstance(com, tuple):
        raise TypeError(
            "Comment delimiters should be declared using a string or a 2-tuple."
        )
    # if comment delimiter is a 2-tuple
    if isinstance(com, tuple):
        # check comment delimiters length
        assert len(com) == 2, "Comment delimiters should be declared using a 2-tuple."
        return f"{com[0]}\n{text}{com[1]}\n"
    # if comment delimiter is a string
    out_lines = []
    for line in text.splitlines():
        line = line.strip()
        out_lines.append(com if not line else f"{com} {line}")
    return "\n".join(out_lines) + "\n\n"


def add_boilerplate(boilerplate, fn) -> int:
    with io.open(fn, "rt") as f:
        text = f.read()
    if not text:
        return UNCHANGED
    m = PATTERN.search(text)
    if m:
        logger.debug("Found existing boilerplate in %s", fn)
        if m.group() == REPL:
            return UNCHANGED
        # update existing
        with io.open(fn, "wt") as f:
            f.write(text.replace(m.group(), REPL))
        return UPDATED
    # add new
    if text.startswith("#!"):
        head, tail = text.split("\n", 1)
        head += "\n\n"
    else:
        head, tail = "", text
    if not tail.startswith("\n"):
        boilerplate += "\n"
    with io.open(fn, "wt") as f:
        f.write(f"{head}{boilerplate}{tail}")
    return CREATED


def __print_section__(msg: str, end: str = "\n"):
    print(f"\n{Fore.BLUE}{Style.BRIGHT}{msg}{Style.RESET_ALL}", end=end)


def __print_done__():
    print(f"{Fore.GREEN}Done!{Style.RESET_ALL}")


def main():
    # configure logging
    logging.basicConfig(level=logging.INFO)

    # result counters
    unchanged = 0
    updated = 0
    created = 0
    errors = 0

    # generate boilerplate
    __print_section__("Generating boilerplate... ", end="")
    join = os.path.join
    boilerplate = get_boilerplate()
    add_boilerplate(boilerplate, LICENSE_FN)
    __print_done__()
    boilerplate = get_boilerplate()  # read the updated version
    logger.debug("Boilerplate:\n%s", boilerplate)

    __print_section__("Adding boilerplate to files...")
    bp_map = {ext: comment(boilerplate, com) for ext, com in COM_MAP.items()}
    for root, dirs, files in os.walk(SOURCE_PATH):
        dirs[:] = [_ for _ in dirs if not _.startswith(".") and _ not in EXCLUDE_DIRS]
        for name in files:
            if name in EXCLUDE_FILES:
                print(f" - {name}: {Style.BRIGHT}excluded{Style.RESET_ALL}")
                continue
            ext = os.path.splitext(name)[-1]
            try:
                bp = bp_map[ext]
            except KeyError:
                logger.debug(f" - {name}: {Style.BRIGHT}not supported{Style.RESET_ALL}")
                continue
            else:
                path = join(root, name)
                logger.debug(f"Adding boilerplate to {path}...")
                result = add_boilerplate(bp, path)
                print(f" - {path}: ", end="")
                if result == UNCHANGED:
                    print(f"{Style.BRIGHT}unchanged{Style.RESET_ALL}")
                    unchanged += 1
                elif result == UPDATED:
                    print(f"{Style.BRIGHT}{Fore.YELLOW}updated{Style.RESET_ALL}")
                    updated += 1
                elif result == CREATED:
                    print(f"{Style.BRIGHT}{Fore.GREEN}created{Style.RESET_ALL}")
                    created += 1
                else:
                    print(f"{Style.BRIGHT}{Fore.RED}error{Style.RESET_ALL}")
                    errors += 1
    __print_section__("DONE!")
    # print summary
    __print_section__("Summary:")
    print(f" - {Style.BRIGHT}{unchanged} files unchanged{Style.RESET_ALL}")
    print(f" - {Style.BRIGHT}{Fore.YELLOW}{updated} files updated{Style.RESET_ALL}")
    print(f" - {Style.BRIGHT}{Fore.GREEN}{created} files created{Style.RESET_ALL}")
    print(f" - {Style.BRIGHT}{Fore.RED}{errors} errors{Style.RESET_ALL}")


if __name__ == "__main__":
    main()
